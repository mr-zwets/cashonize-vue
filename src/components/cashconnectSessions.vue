
<script setup lang="ts">
  defineProps<{
    sessions: any,
  }>()
  const emit = defineEmits(['disconnectSession']);

  async function disconnectSession(topic:any) {
    emit('disconnectSession', topic);
  }
</script>

<template>
  <!-- CashConnect (Vue Container) -->
  <div id="cashconnect-sessions-vue">
    <!-- Sessions -->
    <fieldset style="display: block; margin-top: 15px">
      <legend>CashConnect Sessions (Pre-Alpha)</legend>
      <div class="cc-session-items-container">
        <!-- Iterate over active sessions -->
        <template v-for="(session, topic) of sessions" :key="topic">
          <div class="cc-session-item">
            <div class="cc-session-item-app-icon"><img :src="session.peer.metadata.icons[0]"></div>
            <div class="cc-session-item-details-container">
              <div>{{ session.peer.metadata.name }}</div>
              <div><a href="session.peer.metadata.url" target="_blank">{{ session.peer.metadata.url }}</a></div>
              <div>{{ session.peer.metadata.description }}</div>
            </div>
            <div class="cc-session-item-action-container">
              <div class="cc-session-item-action-icon" @click="disconnectSession(topic)"><img class="trashIcon icon">
              </div>
            </div>
          </div>
        </template>
      </div>
    </fieldset>
  </div>
</template>