<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { useStore } from '../store'
  const store = useStore()

  const selectedTokenType = ref("-select-");
  const inputFungibleSupply = ref("");
  const inputCommitment = ref("")
  const displayPlannedTokenId = computed(() => store.plannedTokenId? `${store.plannedTokenId.slice(0, 20)}...${store.plannedTokenId.slice(-10)}`:"");

  function copyNewTokenId(){
    navigator.clipboard.writeText(store.plannedTokenId ?? "");
  }

  async function hasPreGenesis(){
    store.plannedTokenId = undefined;
    const walletUtxos = await store.wallet?.getAddressUtxos();;
    const preGenesisUtxo = walletUtxos?.find(utxo => !utxo.token && utxo.vout === 0);
    store.plannedTokenId = preGenesisUtxo?.txid ?? "";
  }
  async function createPreGenesis(){
    if(!store.wallet) return;
    try{
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
  
  async function createFungibles(){
    if(!store.wallet) return;
    const validInput = isValidBigInt(inputFungibleSupply.value) && +inputFungibleSupply.value > 0;
    function isValidBigInt(value:string) {
      try { return BigInt(value) }
      catch (e) { return false }
    }
    if(!validInput){ alert(`Input total supply must be a valid integer`); return }
    try{
      const totalSupply = inputFungibleSupply.value;
      const genesisResponse = await store.wallet.tokenGenesis(
        {
          cashaddr: store.wallet.tokenaddr,
          amount: BigInt(totalSupply),    // fungible token amount
          value: 1000,                    // Satoshi value
        }
      );
      const tokenId = genesisResponse?.tokenIds?.[0];
      const { txId } = genesisResponse;
      alert(`Created ${totalSupply} fungible tokens of category ${tokenId}`);
      console.log(`Created ${totalSupply} fungible tokens \n${store.explorerUrl}/tx/${txId}`);
      // reset input fields
      inputFungibleSupply.value = "";
      selectedTokenType.value  = "-select-";
      hasPreGenesis();
    } catch(error){
      console.log(error)
    }
  }
  async function createMintingNFT(){
    if(!store.wallet) return;
    try{
      const genesisResponse = await store.wallet.tokenGenesis(
        {
          cashaddr: store.wallet.tokenaddr,
          commitment: "",
          capability: "minting",
          value: 1000,
        }
      );
      const tokenId = genesisResponse?.tokenIds?.[0];
      const { txId } = genesisResponse;
      alert(`Created minting NFT with category ${tokenId}`);
      console.log(`Created minting NFT with category ${tokenId} \n${store.explorerUrl}/tx/${txId}`);
      // reset input fields
      selectedTokenType.value  = "-select-";
      hasPreGenesis();
    } catch(error){
      console.log(error)
    }
  }
  async function createImmutibleNFT(){
    if(!store.wallet) return;
    const isHex = (str:string) => /^[A-F0-9]+$/i.test(str);
      if(!isHex(inputCommitment.value)){ alert(`Input commitment must only contain hexadecimal characters`); return }
    try{
      const genesisResponse = await store.wallet.tokenGenesis(
        {
          cashaddr: store.wallet.tokenaddr,
          commitment: inputCommitment.value,
          capability: "none",
          value: 1000,
        }
      );
      const tokenId = genesisResponse?.tokenIds?.[0];
      const { txId } = genesisResponse;
      alert(`Created an immutable NFT with commitment ${inputCommitment.value} and category ${tokenId}`);
      console.log(`Created an immutable NFT with commitment ${inputCommitment.value} and category ${tokenId} \n${store.explorerUrl}/tx/${txId}`);
      // reset input fields
      inputFungibleSupply.value = "";
      inputCommitment.value  = "-select-";
      hasPreGenesis();
    } catch(error){
      console.log(error)
    }
  }
</script>

<template>
  <div>
    <fieldset class="item">
      <legend>Create new tokens</legend>
      <div v-if="store.balance?.bch === 0" style="color: red;" id="warningNoBCH">Need BCH in wallet to create tokens</div>
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
      <div v-if="selectedTokenType == '-select-'">
        <b>Fungible Tokens</b> is used to create interchangeable tokens. The total supply of fungible tokens needs to be
        determined at creation. <br>
        <b>Minting NFT</b> is used to create an NFT collection. The minting NFT has the ability to mint new NFTs with the
        same tokenId. <br>
        <b>Immutable NFT</b> is used to create a one-off NFT. There is no option to create more NFTs of the same kind.
        <br><br>
      </div>
      <div v-if="selectedTokenType == 'fungibles'">
        Choose the total supply of fungible tokens
        <input v-model="inputFungibleSupply" placeholder="total supply" type="number"> <br>
        Process might take a few seconds... <input @click="createFungibles" type="button" class="primaryButton" value="Create" style="margin-top: 8px;">
      </div>
      <div v-if="selectedTokenType == 'mintingNFT'">
        Process might take a few seconds... <input @click="createMintingNFT" type="button" class="primaryButton" value="Create" style="margin-top: 8px;">
      </div>
      <div v-if="selectedTokenType == 'immutableNFT'">
        Add immutable commitment data to add to this NFT (hexadecimals only) 
        <input v-model="inputCommitment" placeholder="commitment"> <br>
        Process might take a few seconds... <input @click="createImmutibleNFT" type="button" class="primaryButton" value="Create" style="margin-top: 8px;">
      </div>
    </fieldset>
</div></template>