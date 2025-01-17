import { GlLink, GlIcon } from '@gitlab/ui';
import { sprintf } from '~/locale';
import AgentTable from '~/clusters_list/components/agent_table.vue';
import DeleteAgentButton from '~/clusters_list/components/delete_agent_button.vue';
import { I18N_AGENT_TABLE } from '~/clusters_list/constants';
import { mountExtended } from 'helpers/vue_test_utils_helper';
import { stubComponent } from 'helpers/stub_component';
import timeagoMixin from '~/vue_shared/mixins/timeago';
import { clusterAgents, connectedTimeNow, connectedTimeInactive } from './mock_data';

const defaultConfigHelpUrl =
  '/help/user/clusters/agent/install/index#create-an-agent-configuration-file';

const provideData = {
  gitlabVersion: '14.8',
  kasVersion: '14.8.0',
};
const defaultProps = {
  agents: clusterAgents,
};

const DeleteAgentButtonStub = stubComponent(DeleteAgentButton, {
  template: `<div></div>`,
});

const outdatedTitle = I18N_AGENT_TABLE.versionOutdatedTitle;
const mismatchTitle = I18N_AGENT_TABLE.versionMismatchTitle;
const mismatchOutdatedTitle = I18N_AGENT_TABLE.versionMismatchOutdatedTitle;
const mismatchText = I18N_AGENT_TABLE.versionMismatchText;

describe('AgentTable', () => {
  let wrapper;

  const findAgentLink = (at) => wrapper.findAllByTestId('cluster-agent-name-link').at(at);
  const findStatusText = (at) => wrapper.findAllByTestId('cluster-agent-connection-status').at(at);
  const findStatusIcon = (at) => findStatusText(at).findComponent(GlIcon);
  const findLastContactText = (at) => wrapper.findAllByTestId('cluster-agent-last-contact').at(at);
  const findVersionText = (at) => wrapper.findAllByTestId('cluster-agent-version').at(at);
  const findConfiguration = (at) =>
    wrapper.findAllByTestId('cluster-agent-configuration-link').at(at);
  const findDeleteAgentButton = () => wrapper.findAllComponents(DeleteAgentButton);

  const createWrapper = ({ provide = provideData, propsData = defaultProps } = {}) => {
    wrapper = mountExtended(AgentTable, {
      propsData,
      provide,
      stubs: {
        DeleteAgentButton: DeleteAgentButtonStub,
      },
    });
  };

  describe('agent table', () => {
    describe('default', () => {
      beforeEach(() => {
        createWrapper();
      });

      it.each`
        agentName    | link          | lineNumber
        ${'agent-1'} | ${'/agent-1'} | ${0}
        ${'agent-2'} | ${'/agent-2'} | ${1}
      `('displays agent link for $agentName', ({ agentName, link, lineNumber }) => {
        expect(findAgentLink(lineNumber).text()).toBe(agentName);
        expect(findAgentLink(lineNumber).attributes('href')).toBe(link);
      });

      it.each`
        status               | iconName            | lineNumber
        ${'Never connected'} | ${'status-neutral'} | ${0}
        ${'Connected'}       | ${'status-success'} | ${1}
        ${'Not connected'}   | ${'status-alert'}   | ${2}
      `(
        'displays agent connection status as "$status" at line $lineNumber',
        ({ status, iconName, lineNumber }) => {
          expect(findStatusText(lineNumber).text()).toBe(status);
          expect(findStatusIcon(lineNumber).props('name')).toBe(iconName);
        },
      );

      it.each`
        lastContact                                                  | lineNumber
        ${'Never'}                                                   | ${0}
        ${timeagoMixin.methods.timeFormatted(connectedTimeNow)}      | ${1}
        ${timeagoMixin.methods.timeFormatted(connectedTimeInactive)} | ${2}
      `(
        'displays agent last contact time as "$lastContact" at line $lineNumber',
        ({ lastContact, lineNumber }) => {
          expect(findLastContactText(lineNumber).text()).toBe(lastContact);
        },
      );

      it.each`
        agentConfig                 | link                    | lineNumber
        ${'.gitlab/agents/agent-1'} | ${'/agent/full/path'}   | ${0}
        ${'Default configuration'}  | ${defaultConfigHelpUrl} | ${1}
      `(
        'displays config file path as "$agentPath" at line $lineNumber',
        ({ agentConfig, link, lineNumber }) => {
          const findLink = findConfiguration(lineNumber).findComponent(GlLink);

          expect(findLink.attributes('href')).toBe(link);
          expect(findConfiguration(lineNumber).text()).toBe(agentConfig);
        },
      );

      it('displays actions menu for each agent', () => {
        expect(findDeleteAgentButton()).toHaveLength(clusterAgents.length);
      });
    });

    describe.each`
      agentMockIdx | agentVersion | kasVersion      | versionMismatch | versionOutdated | title
      ${0}         | ${''}        | ${'14.8.0'}     | ${false}        | ${false}        | ${''}
      ${1}         | ${'14.8.0'}  | ${'14.8.0'}     | ${false}        | ${false}        | ${''}
      ${2}         | ${'14.6.0'}  | ${'14.8.0'}     | ${false}        | ${true}         | ${outdatedTitle}
      ${3}         | ${'14.7.0'}  | ${'14.8.0'}     | ${true}         | ${false}        | ${mismatchTitle}
      ${4}         | ${'14.3.0'}  | ${'14.8.0'}     | ${true}         | ${true}         | ${mismatchOutdatedTitle}
      ${5}         | ${'14.6.0'}  | ${'14.8.0-rc1'} | ${false}        | ${false}        | ${''}
      ${6}         | ${'14.8.0'}  | ${'15.0.0'}     | ${false}        | ${true}         | ${outdatedTitle}
      ${7}         | ${'14.8.0'}  | ${'15.0.0-rc1'} | ${false}        | ${true}         | ${outdatedTitle}
      ${8}         | ${'14.8.0'}  | ${'14.8.10'}    | ${false}        | ${false}        | ${''}
    `(
      'when agent version is "$agentVersion", KAS version is "$kasVersion" and version mismatch is "$versionMismatch"',
      ({ agentMockIdx, agentVersion, kasVersion, versionMismatch, versionOutdated, title }) => {
        const currentAgent = clusterAgents[agentMockIdx];

        const findIcon = () => findVersionText(0).findComponent(GlIcon);
        const findPopover = () => wrapper.findByTestId(`popover-${currentAgent.name}`);

        const versionWarning = versionMismatch || versionOutdated;
        const outdatedText = sprintf(I18N_AGENT_TABLE.versionOutdatedText, {
          version: kasVersion,
        });

        beforeEach(() => {
          createWrapper({
            provide: { gitlabVersion: '14.8', kasVersion },
            propsData: { agents: [currentAgent] },
          });
        });

        it('shows the correct agent version text', () => {
          expect(findVersionText(0).text()).toBe(agentVersion);
        });

        if (versionWarning) {
          it('shows a warning icon', () => {
            expect(findIcon().props('name')).toBe('warning');
          });
          it(`renders correct title for the popover when agent versions mismatch is ${versionMismatch} and outdated is ${versionOutdated}`, () => {
            expect(findPopover().props('title')).toBe(title);
          });
          if (versionMismatch) {
            it(`renders correct text for the popover when agent versions mismatch is ${versionMismatch}`, () => {
              expect(findPopover().text()).toContain(mismatchText);
            });
          }
          if (versionOutdated) {
            it(`renders correct text for the popover when agent versions outdated is ${versionOutdated}`, () => {
              expect(findPopover().text()).toContain(outdatedText);
            });
          }
        } else {
          it(`doesn't show a warning icon with a popover when agent versions mismatch is ${versionMismatch} and outdated is ${versionOutdated}`, () => {
            expect(findIcon().exists()).toBe(false);
            expect(findPopover().exists()).toBe(false);
          });
        }
      },
    );
  });
});
