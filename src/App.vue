<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { TestNetWallet, BaseWallet,BalanceResponse  } from "mainnet-js"
  import IndexedDBProvider from "@mainnet-cash/indexeddb-storage"
  import HelloWorld from './components/HelloWorld.vue'

  // reactive state
  const wallet = ref(null as (TestNetWallet | null)) 
  const balance = ref(0 as (number | undefined));
  const nrTokenCategories = ref(0 as (number | undefined));

  // functions that mutate state and trigger updates
  onMounted(async()=>{
    //BaseWallet.StorageProvider = IndexedDBProvider ;
    wallet.value = await TestNetWallet.fromSeed("", "m/44'/0'/0'/0/0") as TestNetWallet;
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
  <main>
    <div class="wrapper">
      <HelloWorld msg="Cashonize-Vue" />
    </div>
    <br>
    <div>
      BCH balance:  
      <span style="color: hsla(160, 100%, 37%, 1);">
        {{ balance ? balance + " sats" : "" }}
      </span>
    </div>
    <div>
      Wallet token balance: 
      <span style="color: hsla(160, 100%, 37%, 1);">
        {{ nrTokenCategories ? nrTokenCategories + " different token categories" : ""}}
      </span>
    </div>
    <div> {{ wallet?.address ?? "" }} </div>
    <div> {{ wallet?.tokenaddr ?? "" }} </div>
  </main>
</template>

<style scoped>
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
