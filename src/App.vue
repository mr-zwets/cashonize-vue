<script setup lang="ts">
  import newWalletView from "./components/newWallet.vue"
  import bchWalletView from "./components/bchWallet.vue"
  import myTokensView from "./components/myTokens.vue"
  import settingsMenu from './components/settingsMenu.vue'
  import connectView from './components/walletConnect.vue'
  import createTokensView from './components/createTokens.vue'
  import { ref, computed } from 'vue'
  import { Wallet, TestNetWallet, BalanceResponse, BCMR, binToHex, BaseWallet, Config } from "mainnet-js"
  import { IndexedDBProvider } from "@mainnet-cash/indexeddb-storage"
  import type { TokenData } from "./interfaces/interfaces"

  const nameWallet = "mywallet";
  const defaultChaingraph = "https://gql.chaingraph.pat.mn/v1/graphql";
  const dafaultIpfsGateway = "https://ipfs.io/ipfs/";
  const defaultBcmrIndexer = "https://bcmr.paytaca.com/api";
  const defaultBcmrIndexerChipnet = "https://bcmr-chipnet.paytaca.com/api";

  // reactive state
  const wallet = ref(null as (Wallet |TestNetWallet | null));
  const balance = ref(undefined as (BalanceResponse | undefined));
  const maxAmountToSend = ref(undefined as (BalanceResponse | undefined));
  const nrTokenCategories = ref(undefined as (number | undefined));
  const tokenList = ref(null as (Array<TokenData> | null));
  const displayView = ref(undefined as (number | undefined));
  const chaingraph = ref(defaultChaingraph);
  const ipfsGateway = ref(dafaultIpfsGateway);
  const bcmrRegistries = ref(undefined as (any[] | undefined));
  const bchUnit = ref("bch" as ("bch" | "sat"));
  const plannedTokenId = ref(undefined as (undefined | string));

  const network = computed(() => wallet.value?.network == "mainnet" ? "mainnet" : "chipnet")
  const bcmrIndexer = computed(() => network.value == "mainnet" ? defaultBcmrIndexer : defaultBcmrIndexerChipnet)

  // set mainnet-js config
  Config.EnforceCashTokenReceiptAddresses = true;
  // @ts-ignore
  BaseWallet.StorageProvider = IndexedDBProvider;
  
  // check if wallet exists
  const mainnetWalletExists = await Wallet.namedExists(nameWallet);
  const testnetWalletExists = await TestNetWallet.namedExists(nameWallet);
  const walletExists = mainnetWalletExists || testnetWalletExists;
  if(walletExists){
    // read local storage
    const readNetwork = localStorage.getItem("network");
    const readUnit = localStorage.getItem("unit");
    // initialise wallet on configured network
    const walletClass = (readNetwork != "chipnet")? Wallet : TestNetWallet;
    const initWallet = await walletClass.named(nameWallet);
    if(readUnit && (readUnit=="bch" || readUnit=="sat")) bchUnit.value = readUnit;
    setWallet(initWallet);
  }

  function changeView(newView: number){
    displayView.value = newView;
  }

  async function setWallet(newWallet: TestNetWallet){
    changeView(1);
    wallet.value = newWallet;
    console.time('Balance Promises');
    const promiseWalletBalance = wallet.value.getBalance() as BalanceResponse;
    const promiseMaxAmountToSend = wallet.value.getMaxAmountToSend();
    const promiseGetFungibleTokens = wallet.value.getAllTokenBalances();
    const promiseGetNFTs = wallet.value.getAllNftTokenBalances();
    const balancePromises: any[] = [promiseWalletBalance, promiseGetFungibleTokens, promiseGetNFTs,promiseMaxAmountToSend];
    const [resultWalletBalance, resultGetFungibleTokens, resultGetNFTs, resultMaxAmountToSend] = await Promise.all(balancePromises);
    console.timeEnd('Balance Promises');
    let tokenCategories = Object.keys({...resultGetFungibleTokens, ...resultGetNFTs});
    balance.value = resultWalletBalance;
    nrTokenCategories.value = tokenCategories.length;
    maxAmountToSend.value = resultMaxAmountToSend;
    const utxosPromise = wallet.value?.getAddressUtxos();
    await updateTokenList(resultGetFungibleTokens, resultGetNFTs);
    setUpWalletSubscriptions();
    // get plannedTokenId
    const walletUtxos = await utxosPromise;
    const preGenesisUtxo = walletUtxos?.find(utxo => !utxo.token && utxo.vout === 0);
    plannedTokenId.value = preGenesisUtxo?.txid ?? "";
    console.time('importRegistries');
    await importRegistries(tokenCategories);
    console.timeEnd('importRegistries');
    // timeout needed for correct rerender
    bcmrRegistries.value = BCMR.getRegistries();
  }

  async function updateTokenList(resultGetFungibleTokens: any, resultGetNFTs: any){
    if(!wallet.value) return // should never happen
    // Get NFT data
    const arrayTokens:TokenData[] = [];
    for (const tokenId of Object.keys(resultGetFungibleTokens)) {
      arrayTokens.push({ tokenId, amount: resultGetFungibleTokens[tokenId] });
    }
    console.time('Utxo Promises');
    const nftUtxoPromises = [];
    for (const tokenId of Object.keys(resultGetNFTs)) {
      nftUtxoPromises.push(wallet.value.getTokenUtxos(tokenId));
    }
    const nftUtxoResults = await Promise.all(nftUtxoPromises);
    for (const nftUtxos of nftUtxoResults) {
      const tokenId = nftUtxos[0].token?.tokenId;
      if(!tokenId) return // should never happen
      arrayTokens.push({ tokenId, nfts: nftUtxos });
    }
    console.timeEnd('Utxo Promises');
    tokenList.value = arrayTokens;
  }

  async function setUpWalletSubscriptions(){
    const cancelWatchBchtxs = wallet.value?.watchBalance(async (newBalance) => {
      balance.value = newBalance;
      maxAmountToSend.value = await wallet.value?.getMaxAmountToSend();
    });
    const cancelWatchTokenTxs = wallet.value?.watchAddressTokenTransactions(async(tx) => {
      if(!wallet.value) return // should never happen
      const walletPkh = binToHex(wallet.value.getPublicKeyHash() as Uint8Array);
      const tokenOutput = tx.vout.find(elem => elem.scriptPubKey.hex.includes(walletPkh));
      const tokenId = tokenOutput?.tokenData?.category;
      if(!tokenId) return;
      const previousTokenList = tokenList.value;
      const isNewCategory = !previousTokenList?.find(elem => elem.tokenId == tokenId);
      const promiseGetFungibleTokens = wallet.value.getAllTokenBalances();
      const promiseGetNFTs = wallet.value.getAllNftTokenBalances();
      const balancePromises: any[] = [promiseGetFungibleTokens, promiseGetNFTs];
      const [resultGetFungibleTokens, resultGetNFTs] = await Promise.all(balancePromises);
      await updateTokenList(resultGetFungibleTokens, resultGetNFTs);
      // Dynamically import token metadata
      if(isNewCategory){
        await importRegistries([tokenId]);
        // timeout needed for correct rerender
        await new Promise(resolve => setTimeout(resolve, 10));
        // Deep copy to trigger watch functions
        bcmrRegistries.value = [...BCMR.getRegistries()];
      }
    });
  }

  function changeUnit(newUnit: "bch" | "sat"){
    bchUnit.value = newUnit;
    localStorage.setItem("unit", newUnit);
    changeView(1);
  }

  async function changeNetwork(newNetwork: "mainnet" | "chipnet"){
    const walletClass = (newNetwork == "mainnet")? Wallet : TestNetWallet;
    const newWallet = await walletClass.named(nameWallet);
    setWallet(newWallet);
    localStorage.setItem("network", newNetwork);
    // reset wallet to default state
    balance.value = undefined;
    nrTokenCategories.value = undefined;
    maxAmountToSend.value = undefined;
    plannedTokenId.value = undefined;
    tokenList.value = null;
    changeView(1);
  }

  // Import onchain resolved BCMRs
  async function importRegistries(tokenIds: string[]) {
    let metadataPromises = [];
    for (let index = 0; index < tokenIds.length; index++) {
      const tokenId = tokenIds[index];
      try {
        const metadataPromise = fetch(`${bcmrIndexer.value}/registries/${tokenId}/latest`);
        metadataPromises.push(metadataPromise);
      } catch (error) { /*console.log(error)*/ }
    }
    console.time('Promises BCMR indexer');
    const resolveMetadataPromsises = Promise.all(metadataPromises);
    const resultsMetadata = await resolveMetadataPromsises;
    console.timeEnd('Promises BCMR indexer');
    for await (const response of resultsMetadata){
      if (response?.status != 404) {
        const jsonResponse = await response.json();
        BCMR.addMetadataRegistry(jsonResponse);
      }
    }
  }
</script>

<template>
  <header>
    <img src="\images\cashonize-logo.png" style="height: 85px;" >
    <nav v-if="displayView" style="display: flex; justify-content: center;">
      <div @click="changeView(1)" v-bind:style="displayView == 1 ? {color: 'var(--color-primary'} : ''">BchWallet</div>
      <div @click="changeView(2)" v-bind:style="displayView == 2 ? {color: 'var(--color-primary'} : ''">MyTokens</div>
      <div @click="changeView(3)" v-bind:style="displayView == 3 ? {color: 'var(--color-primary'} : ''">CreateTokens</div>
      <div @click="changeView(4)" v-bind:style="displayView == 4 ? {color: 'var(--color-primary'} : ''">WalletConnect</div>
      <div @click="changeView(5)">
        <img style="vertical-align: text-bottom;" v-bind:src="displayView == 5 ? 'images/settingsGreen.svg' : 'images/settings.svg'">
      </div>
    </nav>
  </header>
  <main style="margin: 20px auto; max-width: 75rem;">
    <newWalletView v-if="!wallet" @init-wallet="(arg) => setWallet(arg)"/>
    <bchWalletView v-if="displayView == 1" :wallet="(wallet as TestNetWallet | null )" :balance="balance" :nrTokenCategories="nrTokenCategories" :maxAmountToSend="maxAmountToSend" :bchUnit="bchUnit"/>
    <myTokensView v-if="displayView == 2" :wallet="(wallet as TestNetWallet | null )" :tokenList="tokenList" :bcmrRegistries="bcmrRegistries" :chaingraph="chaingraph" :ipfsGateway="ipfsGateway"/>
    <createTokensView v-if="displayView == 3" :wallet="(wallet as TestNetWallet | null )" :balance="balance" :plannedTokenId="plannedTokenId"/>
    <connectView v-if="displayView == 4"/>
    <settingsMenu v-if="displayView == 5" @change-network="(arg) => changeNetwork(arg)" @change-unit="(arg) => changeUnit(arg)" :wallet="(wallet as TestNetWallet | null )" :network="network" :bchUnit="bchUnit"/>
  </main>
</template>

<style scoped>
nav div{
  padding: 1rem 1.8rem;
  cursor: pointer;
  border-bottom: 2px solid var(--color-lightGrey);
}
</style>
