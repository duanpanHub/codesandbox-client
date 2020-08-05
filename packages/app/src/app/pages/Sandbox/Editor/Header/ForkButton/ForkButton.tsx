import * as React from 'react';
import { css } from '@styled-system/css';
import {
  Button,
  Menu,
  Icon,
  Stack,
  Avatar,
  Text,
} from '@codesandbox/components';
import { useOvermind } from 'app/overmind';
import { TeamAvatar } from 'app/components/TeamAvatar';
import { CurrentUser } from '@codesandbox/common/lib/types';
import { MemberAuthorization } from 'app/graphql/types';
import { ForkIcon } from '../icons';

interface TeamItemProps {
  id: string;
  name: string;
  avatar: string | null;
  onSelect: () => void;
  disabled: boolean;
}

const TeamItem = (props: TeamItemProps) => (
  <Menu.Item
    style={{
      paddingTop: 8,
      paddingBottom: 8,
      fontWeight: 500,
      opacity: props.disabled ? 0.4 : 1,
      cursor: props.disabled ? 'not-allowed' : 'pointer',
    }}
    onSelect={props.onSelect}
  >
    <Stack gap={2} align="center">
      <TeamAvatar size="small" avatar={props.avatar} name={props.name} />{' '}
      <Text>{props.name}</Text>
    </Stack>
  </Menu.Item>
);

interface UserItemProps {
  id: string;
  username: string;
  avatarUrl: string;
  onSelect: () => void;
}

const UserItem = (props: UserItemProps) => (
  <Menu.Item
    style={{ paddingTop: 8, paddingBottom: 8, fontWeight: 500 }}
    onSelect={props.onSelect}
  >
    <Stack gap={2} align="center">
      <Avatar
        css={css({ size: 6 })}
        user={{
          avatarUrl: props.avatarUrl,
          username: props.username,
        }}
      />{' '}
      <Text>{props.username} (Personal)</Text>
    </Stack>
  </Menu.Item>
);

type TeamItem = {
  type: 'team';
  teamId: string;
  teamName: string;
  teamAvatar: string | null;
  userAuthorizations: MemberAuthorization[];
};

type UserItem = {
  type: 'user';
  userId: string;
  username: string;
  avatarUrl: string;
};

type TeamOrUser = TeamItem | UserItem;

interface TeamOrUserItemProps {
  item: TeamOrUser;
  forkClicked: (teamId?: string | null) => void;
  disabled: boolean;
}
const TeamOrUserItem: React.FC<TeamOrUserItemProps> = props => {
  if (props.item.type === 'team') {
    return (
      <TeamItem
        id={props.item.teamId}
        onSelect={() => {
          if (props.disabled) return;
          const item = props.item as TeamItem;
          props.forkClicked(item.teamId);
        }}
        name={props.item.teamName}
        avatar={props.item.teamAvatar}
        disabled={props.disabled}
      />
    );
  }

  return (
    <UserItem
      id={props.item.userId}
      username={props.item.username}
      avatarUrl={props.item.avatarUrl}
      onSelect={() => {
        props.forkClicked(null);
      }}
    />
  );
};

interface ForkButtonProps {
  variant: 'primary' | 'secondary';
  forkClicked: (teamId?: string | null) => void;
  user: CurrentUser;
}

export const ForkButton: React.FC<ForkButtonProps> = props => {
  const { state } = useOvermind();
  const { user } = props;

  const userSpace = {
    type: 'user' as 'user',
    userId: user.id,
    avatarUrl: user.avatarUrl,
    username: user.username,
  };

  const allTeams: TeamOrUser[] = [
    userSpace,
    ...state.dashboard.teams.map(team => ({
      type: 'team' as 'team',
      teamId: team.id,
      teamName: team.name,
      teamAvatar: team.avatarUrl,
      userAuthorizations: team.userAuthorizations,
    })),
  ];

  const currentSpace: TeamOrUser =
    allTeams.find(t =>
      state.activeTeam == null
        ? t.type === 'user'
        : t.type === 'team' && t.teamId === state.activeTeam
    ) || userSpace;
  const otherWorkspaces: TeamOrUser[] = allTeams.filter(
    t => t !== currentSpace
  );

  return (
    <Stack>
      {state.activeWorkspaceAuthorization === 'READ' ? null : (
        <Button
          onClick={() => props.forkClicked()}
          loading={state.editor.isForkingSandbox}
          variant={props.variant}
          css={{
            width: 'calc(100% - 26px)',
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
          }}
        >
          <ForkIcon css={css({ height: 3, marginRight: 1 })} /> Fork
        </Button>
      )}

      <Menu>
        <Menu.Button
          variant={props.variant}
          css={
            state.activeWorkspaceAuthorization === 'READ'
              ? {}
              : {
                  width: '26px',
                  borderTopLeftRadius: 0,
                  borderBottomLeftRadius: 0,
                }
          }
        >
          {state.activeWorkspaceAuthorization === 'READ' ? (
            <>
              <ForkIcon css={css({ height: 3, marginRight: 1 })} />{' '}
              <Text css={css({ marginRight: 2 })}>Fork</Text>
            </>
          ) : null}
          <Icon size={8} name="caret" />
        </Menu.Button>
        <Menu.List
          css={css({
            fontSize: 2,
            lineHeight: 1,
          })}
          style={{
            paddingTop: 4,
            paddingBottom: 4,
            marginLeft: '-4rem',
            marginTop: -4,
          }}
        >
          <TeamOrUserItem
            forkClicked={props.forkClicked}
            item={currentSpace}
            disabled={state.activeWorkspaceAuthorization === 'READ'}
          />
          <Menu.Divider />
          {otherWorkspaces.map((space, i) => (
            <TeamOrUserItem
              key={space.type === 'user' ? 'personal' : space.teamId}
              forkClicked={props.forkClicked}
              item={space}
              disabled={
                space.type === 'team' &&
                space.userAuthorizations.find(
                  authorization => authorization.userId === user.id
                )?.authorization === 'READ'
              }
            />
          ))}
        </Menu.List>
      </Menu>
    </Stack>
  );
};
