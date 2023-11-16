<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { TestNetWallet  } from "mainnet-js"
  import { defineCustomElements } from '@bitjson/qr-code';

  const { wallet, balance, nrTokenCategories, network } = defineProps<{
    wallet: TestNetWallet | null,
    balance?: number,
    nrTokenCategories?: number,
    network: ("mainnet" | "chipnet");
  }>()

  defineCustomElements(window);

  // reactive state
  const displayeBchQr = ref(true);
  const sendAmount = ref(0);
  const sendAddr = ref("");

  const explorerUrlMainnet = "https://explorer.bitcoinunlimited.info";
  const explorerUrlChipnet = "https://chipnet.chaingraph.cash";
  let explorerUrl = (network == "mainnet")? explorerUrlMainnet : explorerUrlChipnet;

  function switchAddressTypeQr(){
    displayeBchQr.value = !displayeBchQr.value;
  }
  async function maxSendAmount(){
    try{
      if(!wallet) return;
      const maxAmountToSend = await wallet.getMaxAmountToSend();
      if(!maxAmountToSend.sat) throw("expected a number")
      sendAmount.value = maxAmountToSend.sat;
    } catch(error) {
      console.log(error)
    }
  }
  async function sendBch(){
    try{
      if(!wallet) return;
      const { txId } = await wallet.send([{ cashaddr: sendAddr.value, value: sendAmount.value, unit: "sat" }]);
      alert(`Sent ${sendAmount.value} sats to ${sendAddr.value} \n${explorerUrl}/tx/${txId}`);
      console.log(`Sent ${sendAmount.value} sats to ${sendAddr.value} \n${explorerUrl}/tx/${txId}`);
    } catch(error){
      console.log(error)
    }
  }
</script>


<template>
  <fieldset style="margin-top: 20px; padding-top: 2rem; max-width: 75rem; margin: auto;">
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
  </fieldset>
  <fieldset style="margin-top: 15px;">
    <legend>Send BCH to</legend>
    <div class="inputGroup">
      <span class="addressInput">
        <input v-model="sendAddr" id="sendAddr" placeholder="address">
      </span>
      <span class="sendAmountGroup">
        <span style="width: 100%;" class="input-icon input-icon-right">
          <input v-model="sendAmount" id="sendAmount" type="text" placeholder="amount">
          <i id="sendUnit" style="color: black;">BCH</i>
        </span>
        <button @click="maxSendAmount()" style="color: black;">max</button>
      </span>
    </div>
    <input @click="sendBch()" type="button" class="primaryButton" id="send" value="Send">
  </fieldset>
</template>