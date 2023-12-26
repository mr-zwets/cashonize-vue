<script setup lang="ts">
  import { ref, toRefs, computed } from 'vue'
  import { Wallet, TestNetWallet, BalanceResponse, convert } from "mainnet-js"
  import { defineCustomElements } from '@bitjson/qr-code';

  const props = defineProps<{
    wallet: Wallet | TestNetWallet | null,
    balance?: BalanceResponse,
    maxAmountToSend?: BalanceResponse | undefined,
    nrTokenCategories?: number,
    bchUnit: "bch" | "sat"
  }>()
  const { wallet, balance, maxAmountToSend, nrTokenCategories, bchUnit } = toRefs(props);

  const bchDisplayUnit = computed(() => {
    if(wallet.value?.network == "mainnet") return bchUnit.value == "bch"? " BCH" : " sats"
    else return bchUnit.value == "bch"? " tBCH" : " tsats"
  })
  const displayUnitLong = computed(() => {
    if(wallet.value?.network == "mainnet") return bchUnit.value == "bch"? " BCH" : " satoshis"
    else return bchUnit.value == "bch"? " tBCH" : " testnet satoshis"
  })

  defineCustomElements(window);

  // reactive state
  const displayeBchQr = ref(true);
  const bchSendAmount = ref(undefined as (number | undefined));
  const usdSendAmount = ref(undefined as (number | undefined));
  const destinationAddr = ref("");

  const explorerUrlMainnet = "https://explorer.bitcoinunlimited.info";
  const explorerUrlChipnet = "https://chipnet.chaingraph.cash";
  let explorerUrl = (wallet.value?.network == "mainnet")? explorerUrlMainnet : explorerUrlChipnet;

  function switchAddressTypeQr(){
    displayeBchQr.value = !displayeBchQr.value;
  }
  function copyToClipboard(item: string|undefined){
    if(item) navigator.clipboard.writeText(item);
  }
  async function setUsdAmount() {
    if(typeof bchSendAmount.value != 'number'){
      usdSendAmount.value = undefined
      return
    }
    const newUsdValue = await convert(bchSendAmount.value, bchUnit.value, "usd");
    usdSendAmount.value = Number(newUsdValue.toFixed(2));
  }
  async function setBchAmount() {
    if(typeof usdSendAmount.value != 'number'){
      bchSendAmount.value = undefined
      return
    }
    const newBchValue = await convert(usdSendAmount.value, "usd", bchUnit.value);
    bchSendAmount.value = Number(newBchValue);
  }
  async function useMaxBchAmount(){
    try{
      if(maxAmountToSend?.value && maxAmountToSend?.value[bchUnit.value]){
        bchSendAmount.value = maxAmountToSend.value[bchUnit.value];
        setUsdAmount()
      }
      else throw("expected a number");
    } catch(error) {
      console.log(error)
    }
  }
  async function sendBch(wallet: TestNetWallet | null){
    try{
      if(!wallet) return;
      if(!bchSendAmount.value) throw("No valid amount provided!")
      const { txId } = await wallet.send([{ cashaddr: destinationAddr.value, value: bchSendAmount.value, unit: bchUnit.value}]);
      alert(`Sent ${bchSendAmount.value, displayUnitLong.value} to ${destinationAddr.value} \n${explorerUrl}/tx/${txId}`);
      console.log(`Sent ${bchSendAmount.value, displayUnitLong.value} to ${destinationAddr.value} \n${explorerUrl}/tx/${txId}`);
      bchSendAmount.value = undefined;
      destinationAddr.value = "";
    } catch(error){
      console.log(error)
    }
  }
</script>


<template>
  <fieldset style="margin-top: 20px; padding-top: 2rem; max-width: 75rem; margin: auto;">
    <div v-if="wallet?.network == 'mainnet'" style="font-size: 1.2em">
      USD balance:  
      <span style="color: hsla(160, 100%, 37%, 1);">
        {{ balance && balance.usd != undefined ? balance.usd + " $": "" }}
      </span>
    </div>
    <span>
      BCH balance:  
      <span style="color: hsla(160, 100%, 37%, 1);">
        {{ balance && balance[bchUnit] != undefined ? balance[bchUnit] + displayUnitLong : "" }}
      </span>
    </span>
    <span>
      , Tokens: 
      <span style="color: hsla(160, 100%, 37%, 1);">
        {{ nrTokenCategories != undefined ? nrTokenCategories + " different categories" : ""}}
      </span>
    </span>
    <div>
      BCH address: 
      <span class="depositAddr">{{ wallet?.address ?? "" }} </span>
      <img class="copyIcon" src="/images/copyGrey.svg" @click="() => copyToClipboard(wallet?.address)">
    </div>
    <div>
      Token address:
      <span class="depositAddr">{{ wallet?.tokenaddr ?? "" }}</span>
      <img class="copyIcon" src="/images/copyGrey.svg" @click="() => copyToClipboard(wallet?.tokenaddr)">
    </div>
    <qr-code id="qrCode" :contents="displayeBchQr? wallet?.address : wallet?.tokenaddr" style="display: block; width: 230px; height: 230px; margin: 5px auto 0 auto;">
      <img :src="displayeBchQr? 'images/bch-icon.png':'images/tokenicon.png'" slot="icon" /> <!-- eslint-disable-line -->
    </qr-code>
    <div style="text-align: center;">
      <div id="switchAddress" class="icon" @click="switchAddressTypeQr()" style="font-size: 20px;font-weight: 700;width: fit-content; margin: auto; margin-top: -15px; cursor: pointer;">⇄</div>
    </div>
    <div style="margin-top: 10px;">
      Send BCH:
      <input v-model="destinationAddr" id="destinationAddr" placeholder="address">
      <span class="sendAmountGroup">
        <span style="position: relative; width: 50%;">
          <input v-model="bchSendAmount" @input="setUsdAmount" id="sendAmount" type="number" placeholder="amount">
          <i class="input-icon" style="color: black;">{{ bchDisplayUnit }}</i>
        </span>
        <span style="position: relative; width: 50%; margin-left: 5px;">
          <input v-model="usdSendAmount" @input="setBchAmount" id="sendAmount" type="number" placeholder="amount">
          <i class="input-icon" style="color: black;">{{wallet?.network == "mainnet"? "USD $":"tUsd $"}}</i>
        </span> 
            <button @click="useMaxBchAmount()" style="margin-left: 5px;">max</button>
      </span>
    </div>
    <input @click="sendBch(wallet)" type="button" class="primaryButton" id="send" value="Send" style="margin-top: 8px;">
  </fieldset>
</template>