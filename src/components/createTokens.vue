<script setup lang="ts">
  import { ref, toRefs, computed } from 'vue';
  import { Wallet, TestNetWallet, BalanceResponse } from "mainnet-js"

  const props = defineProps<{
    wallet: Wallet | TestNetWallet | null,
    balance: BalanceResponse | undefined
    plannedTokenId: string | undefined
  }>()
  const { wallet, balance, plannedTokenId } = toRefs(props);

  const selectedTokenType = ref("-select-");

  function copyNewTokenId(){
    navigator.clipboard.writeText(plannedTokenId.value ?? "");
  }
</script>

<template>
  <div>
    <fieldset class="item">
      <legend>Create new tokens</legend>
      <div v-if="balance?.bch === 0" style="color: red;" id="warningNoBCH">Need BCH in wallet to create tokens</div>

      <div style="margin-bottom: 1em;">
        Planned tokenId:
        <span v-if="!plannedTokenId" id="plannedTokenId">loading...</span>
        <span v-if="plannedTokenId"> {{`${plannedTokenId.slice(0, 20)}...${plannedTokenId.slice(-10)}`}} </span>
        <button @click="copyNewTokenId" type="button" style="background: none; padding: 0;">
          <img class="copyIcon icon" src="/images/copy.svg">
        </button>
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