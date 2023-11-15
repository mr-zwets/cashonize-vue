<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { TestNetWallet  } from "mainnet-js"
  import { defineCustomElements } from '@bitjson/qr-code';

  const { wallet, balance, nrTokenCategories } = defineProps<{
    wallet: TestNetWallet | null,
    balance?: number,
    nrTokenCategories?: number
  }>()

  defineCustomElements(window);

  // reactive state
  const displayeBchQr = ref(true);

  function switchAddressTypeQr(){
    displayeBchQr.value = !displayeBchQr.value;
  }
</script>


<template>
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
    <qr-code id="qrCode" :contents="displayeBchQr? wallet?.address : wallet?.tokenaddr" style="width: 240px; margin: 5px auto 0 auto;">
      <img :src="displayeBchQr? 'images/bch-icon.png':'images/tokenicon.png'" slot="icon" /> <!-- eslint-disable-line -->
    </qr-code>
    <div style="text-align: center;">
      <div id="switchAddress" class="icon" @click="switchAddressTypeQr()" style="font-size: 20px;font-weight: 700;width: fit-content; margin: auto; margin-top: -10px; cursor: pointer;">⇄</div>
    </div>
</template>