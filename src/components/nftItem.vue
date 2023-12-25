<script setup lang="ts">
  import { ref, onMounted, watch, toRefs, computed } from 'vue';
  import { Wallet, TestNetWallet, TokenSendRequest, BCMR } from "mainnet-js"
  import { type UtxoI } from "mainnet-js"
  // @ts-ignore
  import { createIcon } from '@download/blockies';
  import type { IdentitySnapshot } from "mainnet-js"

  const props = defineProps<{
    wallet: Wallet | TestNetWallet | null,
    nftData: UtxoI,
    tokenMetaData: IdentitySnapshot | null,
    chaingraph: string
    ipfsGateway: string
    explorerUrl: string
  }>()
  const { wallet, nftData, tokenMetaData, ipfsGateway, explorerUrl } = toRefs(props);

  const displaySendNft = ref(false);
  const displayTokenInfo = ref(false);
  const destinationAddr = ref("");

  const httpsUrlTokenIcon = computed(() => {
    let tokenIconUri = tokenMetaData.value?.uris?.icon;
    const commitment = nftData.value?.token?.commitment;
    const nftMetadata = tokenMetaData.value?.token?.nfts?.parse?.types[commitment ?? ""];
    const nftIconUri = nftMetadata?.uris?.icon;
    if(nftIconUri) tokenIconUri = nftIconUri;
    if(tokenIconUri?.startsWith('ipfs://')){
      return ipfsGateway.value + tokenIconUri.slice(7);
    }
    return tokenIconUri;
  })
  const tokenName = computed(() => {
    let tokenName = tokenMetaData.value?.name;
    const commitment = nftData.value?.token?.commitment;
    const nftMetadata = tokenMetaData?.value?.token?.nfts?.parse?.types[commitment ?? ""];
    const nftName = nftMetadata?.name;
    if(nftName) tokenName = nftName;
    return tokenName;
  })

  async function sendNft(wallet: TestNetWallet | null){
    try{
      if(!wallet || nftData.value?.token) return;
      const nftInfo = nftData.value.token;
      const tokenId = nftInfo?.tokenId as string;
      const tokenCommitment = nftInfo?.commitment;
      const tokenCapability = nftInfo?.capability;
      const { txId } = await wallet.send([
        new TokenSendRequest({
          cashaddr: destinationAddr.value,
          tokenId: tokenId,
          commitment: tokenCommitment,
          capability: tokenCapability,
        }),
      ]);
      console.log(tokenCommitment, tokenCapability)
      const displayId = `${tokenId.slice(0, 20)}...${tokenId.slice(-10)}`;
      alert(`Sent NFT of category ${displayId} to ${destinationAddr.value}`);
      console.log(`Sent NFT of category ${displayId} to ${destinationAddr.value} \n${explorerUrl.value}/tx/${txId}`);
      destinationAddr.value = "";
      displaySendNft.value = false;
    } catch(error){
      console.log(error)
    }
  }
</script>

<template id="nft-template">
  <div class="item">
    <fieldset style="position: relative;">
      <legend>
        <div id="tokenType"></div>
      </legend>
      <!--<div v-if="tokenData?.verified" id="verified" class="verified">
        <div class="tooltip">
          <img class="verifiedIcon" src="/images/check-circle.svg">
          <span class="tooltiptext">Verified</span>
        </div>
      </div>-->
      <div class="tokenInfo">
        <div v-if="!tokenMetaData?.uris?.icon" id="genericTokenIcon" class="tokenIcon"></div>
        <img v-if="tokenMetaData?.uris?.icon" id="tokenIcon" class="tokenIcon" style="width: 48px; border-radius: 50%;" :src="httpsUrlTokenIcon">
        <!--<div v-if="tokenData?.nft" id="tokenIconModal" class="modal">
          <span class="close">&times;</span>
          <img class="modal-content" id="imgTokenIcon" style="width: 400px; max-width: 80%;">
          <div id="caption"></div>
        </div>-->
        <div class="tokenBaseInfo">
          <div class="tokenBaseInfo1">
            <div v-if="tokenName" id="tokenName">Name: {{ tokenName }}</div>
            <div style="word-break: break-all;"> Commitment: {{ nftData?.token?.commitment }}</div>
          </div>
        </div>
      </div>

      <div class="actionBar">
        <span @click="displaySendNft = !displaySendNft" style="margin-left: 10px;" id="sendButton">
          <img id="sendIcon" class="icon" src="/images/send.svg"> send </span>
        <span @click="displayTokenInfo = !displayTokenInfo" id="infoButton">
          <img id="infoIcon" class="icon" src="/images/info.svg"> info
        </span>
        <!--<span v-if="tokenData?.mint" class="tokenButton hide" id="mintButton">
          <img id="mintIcon" class="icon" src="/images/hammer.svg"> mint NFTs
        </span>
        <span v-if="tokenData?.nft" class="tokenButton hide" style="white-space: nowrap;" id="burnButton">
          <img id="burnIcon" class="icon" src="/images/fire.svg">
          <span class="hidemobile">burn NFT</span>
          <span class="showmobile">burn</span>
        </span>
        <span v-if="tokenData?.auth" style="white-space: nowrap;" id="authButton">
          <img id="authIcon" class="icon" src="/images/shield.svg">
          <span class="hidemobile">auth transfer</span>
          <span class="showmobile">auth</span>
        </span>-->
        <div v-if="displayTokenInfo" id="tokenInfoDisplay" style="margin-top: 10px;">
          <div id="tokenBegin"></div>
          <div v-if="tokenMetaData?.description" id="tokenDescription"> {{ tokenMetaData.description }} </div>
          <div id="tokenCommitment"></div>
          <div id="tokenWebLink"></div>
          <div id="onchainTokenInfo" style="white-space: pre-line;"></div>
          <!--<details v-if="tokenData?.nft" id="showAttributes" class="hide">
            <summary>NFT attributes</summary>
            <div id="nftAttributes" style="white-space: pre-wrap;"></div>
          </details>-->
        </div>
        <div v-if="displaySendNft" id="nftSend" style="margin-top: 10px;">
          Send this NFT to
          <p class="grouped">
            <input v-model="destinationAddr" id="tokenAddress" placeholder="token address">
            <input @click="sendNft(wallet)" type="button" class="primaryButton" id="sendNFT" value="Send NFT">
          </p>
        </div>
        <!--<div id="nftMint"  class="hide"  style="margin-top: 10px;">
          Mint a number of (unique) NFTs to a specific address
          <div>
            <input type="checkbox" checked id="uniqueNFTs" onchange="disableInputfield(event)" style="margin: 0px; vertical-align: text-bottom;">
            make each NFT unique by numbering each one in the collection
          </div>
          <p class="grouped" style="align-items: center; margin-bottom: 5px;">
            <input id="amountNFTs" type="number" placeholder="amount NFTs">
            <input id="startingNumberNFTs" type="number" placeholder="starting number" style="margin-right: 0px;">
            <input id="commitmentNFTs" placeholder="commitment" style="display: none;">
          </p>
          <span class="grouped">
            <input id="destinationAddr" placeholder="destinationAddress"> 
            <input type="button" id="mintNFTs" value="Mint NFTs">
          </span>
        </div>
        <div id="nftBurn"  class="hide"  style="margin-top: 10px;">
          Burn this NFT so no new NFTs of this category can be minted
          <br>
          <input type="button" id="burnNFT" value="burn NFT" class="button error">
        </div>
        <div id="authTransfer" class="hide" style="margin-top: 10px;">
          Transfer the authority to change the token's metadata to another wallet <br>
          This should be to a wallet with coin-control, where you can label the Auth UTXO<br>
          It is recommended to use the Electron Cash pc wallet<br>
          <br>
          <span class="grouped">
            <input id="destinationAddr" placeholder="destinationAddress"> 
            <input type="button" id="transferAuth" value="Transfer Auth">
          </span>
        </div>-->
      </div>
    </fieldset>
  </div>
</template>