<script setup lang="ts">
  import newWalletView from "./components/newWallet.vue"
  import bchWalletView from "./components/bchWallet.vue"
  import myTokensView from "./components/myTokens.vue"
  import settingsMenu from './components/settingsMenu.vue'
  import connectView from './components/walletConnect.vue'
  import createTokensView from './components/createTokens.vue'
  import { ref } from 'vue'
  import { Wallet, TestNetWallet, BalanceResponse, BCMR, binToHex } from "mainnet-js"
  import type { TokenData } from "./interfaces/interfaces"

  const nameWallet = "mywallet";
  const defaultChaingraph = "https://gql.chaingraph.pat.mn/v1/graphql";
  const dafaultIpfsGateway = "https://ipfs.io/ipfs/";
  const defaultBcmrIndexer = "https://bcmr.paytaca.com/api";

  // reactive state
  const wallet = ref(null as (Wallet |TestNetWallet | null));
  const network = ref("mainnet" as ("mainnet" | "chipnet"));
  const balance = ref(undefined as (BalanceResponse | undefined));
  const maxAmountToSend = ref(undefined as (BalanceResponse | undefined));
  const nrTokenCategories = ref(undefined as (number | undefined));
  const tokenList = ref(null as (Array<TokenData> | null));
  const displayView = ref(undefined as (number | undefined));
  const chaingraph = ref(defaultChaingraph);
  const ipfsGateway = ref(dafaultIpfsGateway);
  const bcmrIndexer = ref(defaultBcmrIndexer);
  const bcmrRegistries = ref(undefined as (any[] | undefined));
  const bchUnit = ref("bch" as ("bch" | "sat"));
  const plannedTokenId = ref(undefined as (undefined | string));

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
    await importRegistries(tokenCategories);
    // timeout needed for correct rerender
    await new Promise(resolve => setTimeout(resolve, 10));
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
    console.log(newUnit)
    bchUnit.value = newUnit;
    changeView(1);
  }

  async function changeNetwork(newNetwork: "mainnet" | "chipnet"){
    const walletClass = (newNetwork == "mainnet")? Wallet : TestNetWallet;
    const newWallet = await walletClass.named(nameWallet);
    setWallet(newWallet);
    network.value = newNetwork;
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
    // use the bcmrIndexer for mainnet
    if(network.value == "mainnet"){
      let metadataPromises = [];
      for(let index=0; index < tokenIds.length; index++){
        const tokenId = tokenIds[index];
        try{
          const metadataPromise = fetch(`${bcmrIndexer.value}/registries/${tokenId}/latest`);
          metadataPromises.push(metadataPromise);
        } catch(error){ /*console.log(error)*/ }
      }
      console.time('Promises BCMR indexer');
      const resolveMetadataPromsises = Promise.all(metadataPromises);
      const resultsMetadata = await resolveMetadataPromsises;
      console.timeEnd('Promises BCMR indexer');
      resultsMetadata.forEach(async(response) => {
        if(response.status != 404){
          const jsonResponse = await response.json();
          BCMR.addMetadataRegistry(jsonResponse);
        }
      })
    } else {
      let authChainPromises = [];
      for(let index=0; index < tokenIds.length; index++){
        const tokenId = tokenIds[index];
        try{
          const authChainPromise = BCMR.fetchAuthChainFromChaingraph({
            chaingraphUrl: chaingraph.value,
            transactionHash: tokenId,
            network: network.value
          });
          authChainPromises.push(authChainPromise)
        } catch(error){ console.log(error) }
      }
      console.time('Promises ChainGraph');
      const resolveChaingraphPromises = Promise.allSettled(authChainPromises)
      const resultsAuthChains = await resolveChaingraphPromises;
      console.timeEnd('Promises ChainGraph');
      for(let index=0; index < resultsAuthChains.length; index++){
        const authChainResp = resultsAuthChains[index];
        if(authChainResp.status == "fulfilled"){
          try{
            const authChain = authChainResp.value;
            const bcmrLocation = authChain.at(-1)?.uris[0];
            let httpsUrl = authChain.at(-1)?.httpsUrl;
            // If IPFS, use own configured IPFS gateway
            if(bcmrLocation?.startsWith("ipfs://")) httpsUrl = bcmrLocation.replace("ipfs://", ipfsGateway.value);
            if(httpsUrl) await BCMR.addMetadataRegistryFromUri(httpsUrl);
            console.log("Importing an on-chain resolved BCMR from " + httpsUrl);
          }catch(e){ console.log(e) }
        }
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
    <Suspense>
      <newWalletView @init-wallet="(arg) => setWallet(arg)"/>
    </Suspense>
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
