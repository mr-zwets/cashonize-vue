<script setup lang="ts">
  import { ref, toRefs, computed } from 'vue';
  import { BalanceResponse } from "mainnet-js"
  import { useStore } from '../store'
  const store = useStore()

  const props = defineProps<{
    balance: BalanceResponse | undefined
  }>()
  const { balance } = toRefs(props);

  const selectedTokenType = ref("-select-");
  const displayPlannedTokenId = computed(() => store.plannedTokenId? `${store.plannedTokenId.slice(0, 20)}...${store.plannedTokenId.slice(-10)}`:"");

  function copyNewTokenId(){
    navigator.clipboard.writeText(store.plannedTokenId ?? "");
  }

  async function createPreGenesis(){
    try{
      if(!store.wallet) return;
      store.plannedTokenId = undefined;
      const walletAddr = store.wallet.address as string;
      const { txId } = await store.wallet.send([{ cashaddr: walletAddr, value: 10000, unit: "sat" }]);
      console.log(`Created valid preGenesis for token creation \n${store.explorerUrl}/tx/${txId}`);
      let walletUtxos = await store.wallet.getAddressUtxos();
      const createdPreGenesis = walletUtxos.find(utxo => !utxo.token && utxo.vout === 0);
      store.plannedTokenId = createdPreGenesis?.txid;
    } catch(error){
      console.log(error)
    }
  }
</script>

<template>
  <div>
    <fieldset class="item">
      <legend>Create new tokens</legend>
      <div v-if="balance?.bch === 0" style="color: red;" id="warningNoBCH">Need BCH in wallet to create tokens</div>
      <div style="margin-bottom: 1em;">
        <div v-if="store.plannedTokenId == ''">
          Currently the wallet does not have any UTXOs capable of token creation. <br>
          <a @click="createPreGenesis" style="cursor: pointer;">Click here</a> to prepare a UTXO for token-creation.
        </div>
        <div v-else>
           Planned tokenId:
          <span v-if="store.plannedTokenId == undefined" id="plannedTokenId">loading...</span>
          <span v-if="store.plannedTokenId"> {{ displayPlannedTokenId }} </span>
          <button @click="copyNewTokenId" type="button" style="background: none; padding: 0;">
            <img class="copyIcon icon" src="/images/copy.svg">
          </button>
        </div> 
      </div>

      <label for="newtokens">Select token-type:</label>
      <select name="newtokens" id="newtokens"  v-model="selectedTokenType">
        <option autocomplete="off" selected value="-select-">-select-</option>
        <option autocomplete="off" value="fungibles">Fungible Tokens</option>
        <option autocomplete="off" value="mintingNFT">Minting NFT</option>
        <option autocomplete="off" value="immutableNFT">Immutable NFT</option>
      </select>
      <br>
      <div id="infoTokenTypes">
        <b>Fungible Tokens</b> is used to create interchangeable tokens. The total supply of fungible tokens needs to be
        determined at creation. <br>
        <b>Minting NFT</b> is used to create an NFT collection. The minting NFT has the ability to mint new NFTs with the
        same tokenId. <br>
        <b>Immutable NFT</b> is used to create a one-off NFT. There is no option to create more NFTs of the same kind.
        <br><br>
      </div>
    </fieldset>
</div></template>