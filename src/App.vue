<script setup lang="ts">
  import bchWalletView from "./components/bchWallet.vue"
  import myTokensView from "./components/myTokens.vue"
  import HelloWorld from './components/HelloWorld.vue'
  import { ref, onMounted } from 'vue'
  import { Wallet, TestNetWallet, BaseWallet, BalanceResponse } from "mainnet-js"
  import { IndexedDBProvider } from "@mainnet-cash/indexeddb-storage"

  // reactive state
  const wallet = ref(null as (TestNetWallet | null));
  const network = ref("chipnet" as ("mainnet" | "chipnet"));
  const balance = ref(0 as (number | undefined));
  const nrTokenCategories = ref(0 as (number | undefined));
  const displayView = ref(1);

  function changeView(newView: number){
    displayView.value = newView;
  }

  onMounted(async()=>{
    // @ts-ignore
    BaseWallet.StorageProvider = IndexedDBProvider;
    const walletClass = (network.value == "mainnet") ? Wallet: TestNetWallet;
    const seedphrase = "";
    wallet.value = await walletClass.fromSeed(seedphrase, "m/44'/0'/0'/0/0") as TestNetWallet;
    const walletBalance = await wallet.value.getBalance() as BalanceResponse;
    const getFungibleTokensResponse = await wallet.value.getAllTokenBalances();
    const getNFTsResponse = await wallet.value.getAllNftTokenBalances();
    let tokenCategories = Object.keys({...getFungibleTokensResponse, ...getNFTsResponse})
    // update state
    balance.value = walletBalance.sat;
    nrTokenCategories.value = tokenCategories.length;
  })
</script>

<template>
  <main style="margin-top: 20px; max-width: 75rem; margin: auto;">
    <div class="wrapper">
      <HelloWorld msg="Cashonize-Vue" />
    </div>
    <nav style="display: flex; margin: 20px 0px;">
      <div @click="changeView(1)">BchWallet</div>
      <div @click="changeView(2)">MyTokens</div>
      <div @click="changeView(3)">
        <img style="vertical-align: text-bottom;" src="images/settings.svg">
      </div>
    </nav>
    <bchWalletView v-if="displayView == 1" :wallet="(wallet as TestNetWallet | null )" :balance="balance" :nrTokenCategories="nrTokenCategories" :network="network"/>
    <myTokensView v-if="displayView == 2" />
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
