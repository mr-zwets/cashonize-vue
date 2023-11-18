<script setup lang="ts">
  import { ref, defineEmits } from "vue"
  import { Wallet, TestNetWallet, BaseWallet, BalanceResponse, BCMR } from "mainnet-js"
  import { IndexedDBProvider } from "@mainnet-cash/indexeddb-storage"

  const walletExists = ref(false);
  const emit = defineEmits(['initWallet'])

  // @ts-ignore
  BaseWallet.StorageProvider = IndexedDBProvider;
  const nameWallet = "mywallet";
  const mainnetWalletExists = await Wallet.namedExists(nameWallet);
  const testnetWalletExists = await TestNetWallet.namedExists(nameWallet);
  walletExists.value = mainnetWalletExists || testnetWalletExists;
  
  
  if(walletExists.value){
    const walletClass = TestNetWallet;
    const seedphrase = "";
    const  wallet = await walletClass.fromSeed(seedphrase, "m/44'/0'/0'/0/0") as TestNetWallet;
    emit('initWallet',wallet)
  }
</script>

<template>
  <fieldset v-if="!walletExists" style="margin-top: 15px;">
    <h4><img class="icon plusIcon" src="/images/plus-square.svg"> Create new wallet</h4>
    <input class="button primary" type="button" value="Create" onclick="createNewWallet()">
    <br><br>
    <hr>
    <br>
    <h4><img class="icon importIcon" src="/images/import.svg"> Import existing wallet</h4>
    <div>Enter mnemonic seed phrase</div>
    <textarea style="resize: none;" id="enterSeedphrase" rows="3" cols="50" placeholder="word1 word2 ..."></textarea>
    <span>Derivation path: </span>
    <select name="derivationPath" id="derivationPath" onchange="selectTokenType(event)">
      <option value="standard">m/44’/145’/0’ (standard)</option>
      <option value="bitcoinfotcom">m/44’/0’/0’ (bitcoin.com wallet)</option>
    </select> <br>
    <input class="button primary" type="button" style="margin-top:15px" value="Import" onclick="importWallet()">
    <br><br>
  </fieldset>
</template>