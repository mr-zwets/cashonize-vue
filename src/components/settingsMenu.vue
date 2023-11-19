
<script setup lang="ts">
import { ref, toRefs, defineEmits } from 'vue'
  import { Wallet, TestNetWallet  } from "mainnet-js"

  const props = defineProps<{
    wallet: Wallet | TestNetWallet | null,
    network: "mainnet" | "chipnet"
  }>()
  const { wallet, network } = toRefs(props);

  const displayeSeedphrase = ref(false);
  const selectedNetwork = ref(network.value);
  const emit = defineEmits(['changeNetwork']);

  function changeNetwork(){
    const newNetwork = selectedNetwork.value;
    console.log(newNetwork)
    emit('changeNetwork', newNetwork);
  }
  function toggleShowSeedphrase(){
    displayeSeedphrase.value = !displayeSeedphrase.value;
  }
  function confirmDeleteWallet(){
    let text = "You are about to delete your Cashonize wallet info from this browser.\nAre you sure you want to delete?";
    if (confirm(text)){
      indexedDB.deleteDatabase("bitcoincash");
      indexedDB.deleteDatabase("bchtest");
      location.reload(); 
    }
  }
</script>

<template>
  <fieldset class="item">
    <legend>Settings</legend>
    <span style="margin-top: 15px;">Dark mode </span>
    <input type="checkbox" class="js-switch js-check-change" id="darkmode">
    <div style="margin-top:15px">
      <label for="selectUnit">Select default unit:</label>
      <select name="selectUnit" id="selectUnit" onchange="selectUnit(event)">
        <option value="BCH">BCH</option>
        <option value="satoshis">satoshis</option>
      </select>
    </div>
    <div style="margin-top:15px">
      <label for="selectNetwork">Change network:</label>
      <select v-model="selectedNetwork" @change="changeNetwork()">
        <option value="mainnet">mainnet</option>
        <option value="chipnet">chipnet</option>
      </select>
    </div>
    <div style="margin-top:15px">Make backup of seed phrase (mnemonic)</div>
    <input @click="toggleShowSeedphrase()" class="button primary" type="button" style="padding: 1rem 1.5rem; display: block;" 
      :value="displayeSeedphrase? 'Hide seed phrase' : 'Show seed phrase'"
    >
    <div v-if="displayeSeedphrase" id="seedphrase"> {{ wallet?.mnemonic }}</div>
    <br>
    <span style="margin-top:15px">Derivation path of this wallet is {{ wallet?.derivationPath }}</span>
    <div style="margin-top:15px">Remove wallet data from browser</div>
    <input @click="confirmDeleteWallet()" type="button" id="burnNFT" value="Delete wallet" class="button error" style="display: block;">
  </fieldset>
</template>