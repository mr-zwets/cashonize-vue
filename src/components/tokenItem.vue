<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  // @ts-ignore
  import { createIcon } from '@download/blockies';

  interface TokenData {
    tokenId: string,
    amount: number
  }

  const { tokenData } = defineProps<{
    tokenData: TokenData,
    chaingraph: string
  }>()

  const displaySendTokens = ref(false);
  const displayTokenInfo = ref(false)

  onMounted(() => {
    let icon = createIcon({
      seed: tokenData.tokenId,
      size: 12,
      scale: 4,
      spotcolor: '#000'
    });
    icon.style = "display: block; border-radius: 50%;"
    const template = document.querySelector(`#id${tokenData.tokenId.slice(0, 10)}`);
    const iconDiv = template?.querySelector("#tokenIcon")
    iconDiv?.replaceWith(icon);
  })
</script>

<template id="token-template">
  <div :id="`id${tokenData.tokenId.slice(0, 10)}`" class="item">
    <fieldset style="position: relative;">
      <legend>
        <div id="tokenType"></div>
      </legend>
      <div v-if="tokenData?.verified" id="verified" class="verified">
        <div class="tooltip">
          <img class="verifiedIcon" src="/images/check-circle.svg">
          <span class="tooltiptext">Verified</span>
        </div>
      </div>
      <div class="tokenInfo">
        <div id="tokenIcon" class="tokenIcon"></div>
        <div v-if="tokenData?.nft" id="tokenIconModal" class="modal">
          <span class="close">&times;</span>
          <img class="modal-content" id="imgTokenIcon" style="width: 400px; max-width: 80%;">
          <div id="caption"></div>
        </div>
        <div class="tokenBaseInfo">
          <div class="tokenBaseInfo1">
            <div id="tokenName"></div>
            <div id="tokenIdBox" style="word-break: break-all;">
              TokenId: {{ `${tokenData.tokenId.slice(0, 20)}...${tokenData.tokenId.slice(-10)}` }}
              <button type="button" style="background: none; padding: 0; " onclick="copyTokenID(event)">
                <img class="copyIcon icon" src="/images/copy.svg">
              </button>
            </div>
            <div id="childNftCommitment" style="word-break: break-all;" class="hide"></div>
          </div>
          <div class="tokenAmount" id="tokenAmount">Token amount: {{ tokenData.amount }}</div>
          <div v-if="tokenData?.nfts" class="childNfts" id="childNfts" style=" cursor: pointer;">
            <span class="nrChildNfts" id="nrChildNfts"></span>
            <span class="hide" id="showMore" style="margin-left: 10px;">
              <img id="showIcon" class="icon" style="vertical-align: text-bottom;" src="/images/chevron-square-down.svg">
            </span>
          </div>

        </div>
      </div>

      <div class="actionBar">
        <span @click="displaySendTokens = !displaySendTokens" style="margin-left: 10px;" class="tokenButton" id="sendButton">
          <img id="sendIcon" class="icon" src="/images/send.svg"> send </span>
        <span @click="displayTokenInfo = !displayTokenInfo" class="tokenButton" id="infoButton">
          <img id="infoIcon" class="icon" src="/images/info.svg"> info
        </span>
        <span v-if="tokenData?.mint" class="tokenButton hide" id="mintButton">
          <img id="mintIcon" class="icon" src="/images/hammer.svg"> mint NFTs
        </span>
        <span v-if="tokenData?.nft" class="tokenButton hide" style="white-space: nowrap;" id="burnButton">
          <img id="burnIcon" class="icon" src="/images/fire.svg">
          <span class="hidemobile">burn NFT</span>
          <span class="showmobile">burn</span>
        </span>
        <span v-if="tokenData?.auth" class="tokenButton" style="white-space: nowrap;" id="authButton">
          <img id="authIcon" class="icon" src="/images/shield.svg">
          <span class="hidemobile">auth transfer</span>
          <span class="showmobile">auth</span>
        </span>
        <div v-if="displayTokenInfo" id="tokenInfoDisplay" style="margin-top: 10px;">
          <div id="tokenBegin"></div>
          <div id="tokenDescription"></div>
          <div id="tokenDecimals"></div>
          <div id="tokenCommitment"></div>
          <div id="tokenWebLink"></div>
          <div id="onchainTokenInfo" style="white-space: pre-line;"></div>
          <details id="showAttributes" class="hide">
            <summary>NFT attributes</summary>
            <div id="nftAttributes" style="white-space: pre-wrap;"></div>
          </details> 
        </div>
        <div v-if="displaySendTokens" id="tokenSend" style="margin-top: 10px;">
          Send these tokens to
          <p class="inputGroup">
            <span class="addressInput"><input id="tokenAddress" placeholder="token address"></span>
            <span class="sendAmountGroup">
              <span style="width: 100%;" class="input-icon input-icon-right">
                <input id="sendTokenAmount" placeholder="amount">
                <i id="sendUnit" style="color: black; width: 70px;">tokens</i>
              </span>
              <button  id="maxButton" style="color: black;">max</button>
            </span>
          </p>
          <input type="button" id="sendSomeButton" class="primaryButton" value="Send">
        </div><!--
        <div id="nftSend"  class="hide"  style="margin-top: 10px;">
          Send this NFT to
          <p class="grouped">
            <input id="tokenAddress" placeholder="tokenAddress">
            <input type="button" class="primaryButton" id="sendNFT" value="Send NFT">
          </p>
        </div>
        <div id="nftMint"  class="hide"  style="margin-top: 10px;">
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