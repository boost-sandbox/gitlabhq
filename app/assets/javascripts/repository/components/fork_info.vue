<script>
import { GlIcon, GlLink, GlSkeletonLoader, GlLoadingIcon, GlSprintf, GlButton } from '@gitlab/ui';
import { s__, sprintf, n__ } from '~/locale';
import { createAlert } from '~/alert';
import syncForkMutation from '~/repository/mutations/sync_fork.mutation.graphql';
import glFeatureFlagMixin from '~/vue_shared/mixins/gl_feature_flags_mixin';
import {
  POLLING_INTERVAL_DEFAULT,
  POLLING_INTERVAL_BACKOFF,
  FIVE_MINUTES_IN_MS,
} from '../constants';
import forkDetailsQuery from '../queries/fork_details.query.graphql';
import ConflictsModal from './fork_sync_conflicts_modal.vue';

export const i18n = {
  forkedFrom: s__('ForkedFromProjectPath|Forked from'),
  inaccessibleProject: s__('ForkedFromProjectPath|Forked from an inaccessible project.'),
  upToDate: s__('ForksDivergence|Up to date with the upstream repository.'),
  unknown: s__('ForksDivergence|This fork has diverged from the upstream repository.'),
  behind: s__('ForksDivergence|%{behindLinkStart}%{behind} %{commit_word} behind%{behindLinkEnd}'),
  ahead: s__('ForksDivergence|%{aheadLinkStart}%{ahead} %{commit_word} ahead%{aheadLinkEnd} of'),
  behindAhead: s__('ForksDivergence|%{messages} the upstream repository.'),
  limitedVisibility: s__('ForksDivergence|Source project has a limited visibility.'),
  error: s__('ForksDivergence|Failed to fetch fork details. Try again later.'),
  sync: s__('ForksDivergence|Update fork'),
};

export default {
  i18n,
  components: {
    GlIcon,
    GlLink,
    GlButton,
    GlSprintf,
    GlSkeletonLoader,
    ConflictsModal,
    GlLoadingIcon,
  },
  mixins: [glFeatureFlagMixin()],
  apollo: {
    project: {
      query: forkDetailsQuery,
      notifyOnNetworkStatusChange: true,
      variables() {
        return this.forkDetailsQueryVariables;
      },
      skip() {
        return !this.sourceName;
      },
      error(error) {
        createAlert({
          message: this.$options.i18n.error,
          captureError: true,
          error,
        });
      },
      result({ loading }) {
        this.handlePolingInterval(loading);
      },
      pollInterval() {
        return this.pollInterval;
      },
    },
  },
  props: {
    projectPath: {
      type: String,
      required: true,
    },
    selectedBranch: {
      type: String,
      required: true,
    },
    sourceDefaultBranch: {
      type: String,
      required: false,
      default: '',
    },
    sourceName: {
      type: String,
      required: false,
      default: '',
    },
    sourcePath: {
      type: String,
      required: false,
      default: '',
    },
    aheadComparePath: {
      type: String,
      required: false,
      default: '',
    },
    behindComparePath: {
      type: String,
      required: false,
      default: '',
    },
  },
  data() {
    return {
      project: {},
      currentPollInterval: null,
      isSyncTriggered: false,
    };
  },
  computed: {
    forkDetailsQueryVariables() {
      return {
        projectPath: this.projectPath,
        ref: this.selectedBranch,
      };
    },
    pollInterval() {
      return this.isSyncing ? this.currentPollInterval : 0;
    },
    isLoading() {
      return this.$apollo.queries.project.loading;
    },
    forkDetails() {
      return this.project?.forkDetails;
    },
    hasConflicts() {
      return this.forkDetails?.hasConflicts;
    },
    isSyncing() {
      return this.forkDetails?.isSyncing;
    },
    ahead() {
      return this.project?.forkDetails?.ahead;
    },
    behind() {
      return this.project?.forkDetails?.behind;
    },
    behindText() {
      return sprintf(this.$options.i18n.behind, {
        behind: this.behind,
        commit_word: n__('commit', 'commits', this.behind),
      });
    },
    aheadText() {
      return sprintf(this.$options.i18n.ahead, {
        ahead: this.ahead,
        commit_word: n__('commit', 'commits', this.ahead),
      });
    },
    isUnknownDivergence() {
      return this.sourceName && this.ahead === null && this.behind === null;
    },
    isUpToDate() {
      return this.ahead === 0 && this.behind === 0;
    },
    behindAheadMessage() {
      const messages = [];
      if (this.behind > 0) {
        messages.push(this.behindText);
      }
      if (this.ahead > 0) {
        messages.push(this.aheadText);
      }
      return messages.join(', ');
    },
    hasBehindAheadMessage() {
      return this.behindAheadMessage.length > 0;
    },
    isSyncButtonAvailable() {
      return (
        this.glFeatures.synchronizeFork &&
        ((this.sourceName && this.forkDetails && this.behind) || this.isUnknownDivergence)
      );
    },
    forkDivergenceMessage() {
      if (!this.forkDetails) {
        return this.$options.i18n.limitedVisibility;
      }
      if (this.isUnknownDivergence) {
        return this.$options.i18n.unknown;
      }
      if (this.hasBehindAheadMessage) {
        return sprintf(this.$options.i18n.behindAhead, {
          messages: this.behindAheadMessage,
        });
      }
      return this.$options.i18n.upToDate;
    },
  },
  watch: {
    hasConflicts(newVal) {
      if (newVal && this.isSyncTriggered) {
        this.showConflictsModal();
        this.isSyncTriggered = false;
      }
    },
  },
  methods: {
    async syncForkWithPolling() {
      await this.$apollo.mutate({
        mutation: syncForkMutation,
        variables: {
          projectPath: this.projectPath,
          targetBranch: this.selectedBranch,
        },
        error(error) {
          createAlert({
            message: error.message,
            captureError: true,
            error,
          });
        },
        update: (store, { data: { projectSyncFork } }) => {
          const { details } = projectSyncFork;

          store.writeQuery({
            query: forkDetailsQuery,
            variables: this.forkDetailsQueryVariables,
            data: {
              project: {
                id: this.project.id,
                forkDetails: details,
              },
            },
          });
        },
      });
    },
    showConflictsModal() {
      this.$refs.modal.show();
    },
    startSyncing() {
      this.isSyncTriggered = true;
      this.syncForkWithPolling();
    },
    checkIfSyncIsPossible() {
      if (this.hasConflicts) {
        this.showConflictsModal();
      } else {
        this.startSyncing();
      }
    },
    handlePolingInterval(loading) {
      if (!loading && this.isSyncing) {
        const backoff = POLLING_INTERVAL_BACKOFF;
        const interval = this.currentPollInterval;
        const newInterval = Math.min(interval * backoff, FIVE_MINUTES_IN_MS);
        this.currentPollInterval = this.currentPollInterval
          ? newInterval
          : POLLING_INTERVAL_DEFAULT;
      }
      if (this.currentPollInterval === FIVE_MINUTES_IN_MS) {
        this.$apollo.queries.forkDetailsQuery.stopPolling();
      }
    },
  },
};
</script>

<template>
  <div class="info-well gl-sm-display-flex gl-flex-direction-column">
    <div class="well-segment gl-p-5 gl-w-full gl-display-flex">
      <gl-icon name="fork" :size="16" class="gl-display-block gl-m-4 gl-text-center" />
      <div
        class="gl-display-flex gl-justify-content-space-between gl-align-items-center gl-flex-grow-1"
      >
        <div v-if="sourceName">
          {{ $options.i18n.forkedFrom }}
          <gl-link data-qa-selector="forked_from_link" :href="sourcePath">{{ sourceName }}</gl-link>
          <gl-skeleton-loader v-if="isLoading" :lines="1" />
          <div v-else class="gl-text-secondary" data-testid="divergence-message">
            <gl-sprintf :message="forkDivergenceMessage">
              <template #aheadLink="{ content }">
                <gl-link :href="aheadComparePath">{{ content }}</gl-link>
              </template>
              <template #behindLink="{ content }">
                <gl-link :href="behindComparePath">{{ content }}</gl-link>
              </template>
            </gl-sprintf>
          </div>
        </div>
        <div
          v-else
          data-testid="inaccessible-project"
          class="gl-align-items-center gl-display-flex"
        >
          {{ $options.i18n.inaccessibleProject }}
        </div>
        <gl-button
          v-if="isSyncButtonAvailable"
          :disabled="forkDetails.isSyncing"
          @click="checkIfSyncIsPossible"
        >
          <gl-loading-icon v-if="forkDetails.isSyncing" class="gl-display-inline" size="sm" />
          <span>{{ $options.i18n.sync }}</span>
        </gl-button>
        <conflicts-modal
          ref="modal"
          :source-name="sourceName"
          :source-path="sourcePath"
          :source-default-branch="sourceDefaultBranch"
        />
      </div>
    </div>
  </div>
</template>
