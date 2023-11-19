<script setup lang="ts">
  import newWalletView from "./components/newWallet.vue"
  import bchWalletView from "./components/bchWallet.vue"
  import myTokensView from "./components/myTokens.vue"
  import settingsMenu from './components/settingsMenu.vue'
  import HelloWorld from './components/HelloWorld.vue'
  import { ref } from 'vue'
  import { Wallet, TestNetWallet, BalanceResponse, BCMR } from "mainnet-js"

  interface TokenData{
    tokenId: string,
    amount: number
  }

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

  function changeView(newView: number){
    displayView.value = newView;
  }

  async function setWallet(newWallet: TestNetWallet){
    changeView(1);
    wallet.value = newWallet;
    console.time('Balance Promises');
    const promiseWalletBalance = wallet.value.getBalance() as BalanceResponse;
    const promiseMaxAmountToSend =await wallet.value.getMaxAmountToSend();
    const promiseGetFungibleTokens = wallet.value.getAllTokenBalances();
    const promiseGetNFTs = wallet.value.getAllNftTokenBalances();
    const balancePromises: any[] = [promiseWalletBalance, promiseGetFungibleTokens, promiseGetNFTs,promiseMaxAmountToSend];
    const [resultWalletBalance, resultGetFungibleTokens, resultGetNFTs, resultMaxAmountToSend] = await Promise.all(balancePromises);
    console.timeEnd('Balance Promises');
    let tokenCategories = Object.keys({...resultGetFungibleTokens, ...resultGetNFTs})
    const arrayTokens = [];
    for (const tokenId of Object.keys(resultGetFungibleTokens)) {
      arrayTokens.push({ tokenId, amount: resultGetFungibleTokens[tokenId] });
    }
    balance.value = resultWalletBalance;
    nrTokenCategories.value = tokenCategories.length;
    tokenList.value = arrayTokens;
    maxAmountToSend.value = resultMaxAmountToSend;
    setUpWalletSubscriptions();
    await importRegistries( Object.keys({...resultGetFungibleTokens}));
    // timeout needed for correct rerender
    await new Promise(resolve => setTimeout(resolve, 10));
    bcmrRegistries.value = BCMR.getRegistries();
  }

  async function setUpWalletSubscriptions(){
    const cancelWatchBchtxs = wallet.value?.watchBalance(async (newBalance) => {
      balance.value = newBalance;
    });
    const cancelWatchTokenTxs = wallet.value?.watchAddressTokenTransactions(async(tx) => {
      console.log(tx)
    });
  }

  async function changeNetwork(newNetwork: "mainnet" | "chipnet"){
    const walletClass = (newNetwork == "mainnet")? Wallet : TestNetWallet;
    console.log(newNetwork)
    const newWallet = await walletClass.named(nameWallet);
    setWallet(newWallet);
    network.value = newNetwork;
    console.log(newNetwork)
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
          metadataPromises.push(metadataPromise)
        } catch(error){ console.log(error) }
      }
      console.time('Promises BCMR indexer');
      const resolveMetadataPromsises = Promise.all(metadataPromises)
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
  <main style="margin-top: 20px; max-width: 75rem; margin: auto;">
    <div class="wrapper">
      <HelloWorld msg="Cashonize-Vue" />
    </div>
    <nav v-if="displayView" style="display: flex; margin: 20px 0px;">
      <div @click="changeView(1)">BchWallet</div>
      <div @click="changeView(2)">MyTokens</div>
      <div @click="changeView(3)">
        <img style="vertical-align: text-bottom;" src="images/settings.svg">
      </div>
    </nav>
    <Suspense>
      <newWalletView @init-wallet="(arg) => setWallet(arg)"/>
    </Suspense>
    <bchWalletView v-if="displayView == 1" :wallet="(wallet as TestNetWallet | null )" :balance="balance" :nrTokenCategories="nrTokenCategories" :maxAmountToSend="maxAmountToSend"/>
    <myTokensView v-if="displayView == 2" :wallet="(wallet as TestNetWallet | null )" :tokenList="tokenList" :bcmrRegistries="bcmrRegistries" :chaingraph="chaingraph" :ipfsGateway="ipfsGateway"/>
    <settingsMenu @change-network="(arg) => changeNetwork(arg)" :wallet="(wallet as TestNetWallet | null )" v-if="displayView == 3" :network="network"/>
  </main>
</template>

<style scoped>
nav div{
  padding: 1rem 1.8rem;
  cursor: pointer;
  border-bottom: 2px solid var(--color-lightGrey);
}
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
