// Placeholder
import {
  Affix,
  Button,
  Card,
  Container,
  createStyles,
  Grid,
  Group,
  MantineProvider,
  Paper,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  Title,
} from "@mantine/core";
import {
  IconBrandGithub,
  IconBrandTwitter,
  IconBrandYoutube,
  IconCheck,
  IconFileTime,
  IconHandRock,
  IconMail,
  IconRefresh,
  IconUser,
  IconZoomQuestion,
  TablerIcon,
} from "@tabler/icons";
import React from "react";
import ReactDOM from "react-dom";
import { Messages } from "./enums";
import { PopupRedirectMessage } from "./popup";
ReactDOM.render(
  <MantineProvider
    theme={{
      colorScheme: "dark",
    }}
    withGlobalStyles
    withNormalizeCSS
  >
    <Options />
  </MantineProvider>,
  // eslint-disable-next-line no-undef
  document.getElementById("root")
);

const optionRedirect = (url: string): void => {
  console.debug("Redirecting to url " + url);
  // 1.

  const message: PopupRedirectMessage = {
    type: Messages.POPUP_REDIRECT,
    url,
  };

  chrome.runtime.sendMessage(message);
};

/**
 * Options Component
 * This component is the options page that appears when the user opens the extension options.
 * Required Functionality:
 * 1. Allow user to modify options
 * 1.1. Prefer new tab vs current tab
 * 1.2. Video Options
 * 1.2.1. Display video background glow
 * 1.2.2. Display video redirect button
 * 1.3. Channel Options
 * 1.3.1. Display channel background glow
 * 1.3.2. Display channel redirect button
 * 2. Allow user to view developer information
 * 2.1 GitHub repo
 * 2.2 Twitter
 * 3. Contact me
 * 4. Allow user to request a refresh of the Nebula data
 * 5. Allow user to view the Nebula data in more detail
 * 5.1. Graphs
 * 5.1.1. Matched videos
 * 5.1.2. Matched channels
 * 5.1.3. unMatched videos
 * 5.2. Tables
 * 5.2.1. Matched videos by channel
 */

type Option = {
  title: string;
  description: string;
  value: string | boolean;
  // eslint-disable-next-line no-unused-vars
  callback: (value: boolean) => void;
};

type Link = {
  title: string;
  description: string;
  url: string;
  icon: TablerIcon;
  color: string;
};

type Stat = {
  title: string;
  description: string;
  value: string;
  icon: TablerIcon;
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function Options() {
  // Use mantine.dev for UI components

  const options = [] as Option[];

  // Set the options in individual state variables and defaults
  // TODO: Get the options from the background script

  // ================== Options ==================
  const [preferNewTab, setPreferNewTab] = React.useState<boolean>(true);
  options.push({
    title: "Prefer New Tab",
    description: "Open links in a new tab instead of the current tab",
    value: preferNewTab,
    callback: setPreferNewTab,
  });

  const [displayVideoBackgroundGlow, setDisplayVideoBackgroundGlow] =
    React.useState<boolean>(true);
  options.push({
    title: "Video Glow",
    description: "Highlights a video on YouTube when it is available on Nebula",
    value: displayVideoBackgroundGlow,
    callback: setDisplayVideoBackgroundGlow,
  });
  const [displayVideoRedirectButton, setDisplayVideoRedirectButton] =
    React.useState<boolean>(true);
  options.push({
    title: "Video Button",
    description: "Displays a redirect button for matched videos",
    value: displayVideoRedirectButton,
    callback: setDisplayVideoRedirectButton,
  });
  const [displayChannelBackgroundGlow, setDisplayChannelBackgroundGlow] =
    React.useState<boolean>(true);
  options.push({
    title: "Channel Glow",
    description:
      "Highlight a channel on YouTube when it is available on Nebula",
    value: displayChannelBackgroundGlow,
    callback: setDisplayChannelBackgroundGlow,
  });
  const [displayChannelRedirectButton, setDisplayChannelRedirectButton] =
    React.useState<boolean>(true);
  options.push({
    title: "Channel Button",
    description: "Displays a redirect button for matched channels",
    value: displayChannelRedirectButton,
    callback: setDisplayChannelRedirectButton,
  });

  const optionsList = options.map((option) => (
    <Card key={option.title}>
      <Text fz={"lg"}> {option.title} </Text>
      <Switch
        checked={option.value as boolean}
        onChange={(value): void => {
          const bool = value.currentTarget.checked;
          console.debug("Setting " + option.title + " to " + bool);
          option.callback(bool);
        }}
        label={option.description}
      />
    </Card>
  ));

  // ================== Links ==================
  const links = [
    {
      title: "GitHub repo",
      description: "View the Nebulate extension GitHub repo",
      url: "https://github.com/oenu/Nebulate",
      icon: IconBrandGithub,
      color: "#333",
    },
    {
      title: "Twitter",
      description: "Follow me on Twitter",
      url: "https://twitter.com/_a_nb",
      icon: IconBrandTwitter,
      color: "#1DA1F2",
    },
    {
      title: "Contact",
      description: "Contact me via email",
      url: "mailto:oenu.dev@gmail.com?subject=YouTube%20Nebula%20Extension%20Contact",
      icon: IconMail,
      color: "#D44638",
    },
    {
      title: "Hire me",
      description: "Im a junior developer based in Canada!",
      url: "mailto:oenu.dev@gmail.com?subject=YouTube%20Nebula%20Extension%20Work",
      icon: IconHandRock,
      color: "#6cc644",
    },
  ] as Link[];

  // ================== Stats ==================
  const stats: Stat[] = [
    {
      title: "Nebula Creators",
      description: "Number of channels that are being monitored",
      value: "0",
      icon: IconUser,
    },
    {
      title: "YouTube Videos",
      description: "Number of YouTube videos from Nebula creators",
      value: "0",
      icon: IconBrandYoutube,
    },
    {
      title: "Matched Videos",
      description: "Number of videos that are available on Nebula and YouTube",
      value: "0",
      icon: IconCheck,
    },
    {
      title: "Unmatched Videos",
      description: "Number of videos that have no direct match on Nebula",
      value: "0",
      icon: IconZoomQuestion,
    },
    {
      title: "Database Generated At",
      description: "Time the last Nebula data file was generated",
      value: "0",
      icon: IconFileTime,
    },
    {
      title: "Database Last Synced At",
      description: "Time the Nebula data was last synced",
      value: "0",
      icon: IconRefresh,
    },
  ];

  const useStyles = createStyles((theme) => ({
    root: {
      paddingBottom: theme.spacing.xl * 2,
    },

    value: {
      fontSize: 24,
      fontWeight: 700,
      lineHeight: 1,
    },

    icon: {
      color:
        theme.colorScheme === "dark"
          ? theme.colors.dark[3]
          : theme.colors.gray[4],
    },

    title: {
      fontWeight: 700,
      textTransform: "uppercase",
    },
  }));

  // const icons = {
  //   nebula: IconStar,
  //   youtube: IconBrandYoutube,
  //   channel: IconUser,
  //   match: IconCheck,
  //   unmatch: IconZoomQuestion,
  //   generatedAt: IconFileTime,
  //   updatedAt: IconRefresh,
  // };
  interface StatsGridProps {
    data: {
      title: string;
      icon: TablerIcon;
      description: string;
      value: string;
    }[];
  }

  // eslint-disable-next-line no-undef
  const StatsGrid = ({ data }: StatsGridProps): JSX.Element => {
    const { classes } = useStyles();
    const stats = data.map((stat) => {
      const Icon = stat.icon;

      return (
        <Paper withBorder p="md" radius="md" key={stat.title}>
          <Group position="apart">
            <Text size="xs" color="dimmed" className={classes.title}>
              {stat.title}
            </Text>
            <Icon className={classes.icon} size={22} stroke={1.5} />
          </Group>

          <Group align="flex-end" spacing="xs" mt={25}>
            <Text className={classes.value}>{stat.value}</Text>
          </Group>

          <Text size="xs" color="dimmed" mt={7}>
            {stat.description}
          </Text>
        </Paper>
      );
    });
    return (
      <div className={classes.root}>
        <SimpleGrid
          cols={3}
          breakpoints={[
            { maxWidth: "md", cols: 2 },
            { maxWidth: "xs", cols: 1 },
          ]}
        >
          {stats}
        </SimpleGrid>
      </div>
    );
  };

  const linksList = links.map((link) => (
    <Card key={link.title}>
      <Group>
        <Button
          leftIcon={<link.icon />}
          onClick={(): void => {
            optionRedirect(link.url);
          }}
          style={{ width: "30%", backgroundColor: link.color }}
        >
          {link.title}
        </Button>
        <Text fz={"sm"}> {link.description} </Text>
      </Group>
    </Card>
  ));

  return (
    <Container size={"xl"}>
      <Stack spacing={"md"}>
        <Grid>
          <Grid.Col lg={6} md={6} sm={12} xs={12}>
            <Title mt={"xl"} mb={"md"} order={1}>
              Options
            </Title>
            <Stack>{optionsList}</Stack>
          </Grid.Col>
          <Grid.Col lg={6} md={6} sm={12} xs={12}>
            <Title mt={"xl"} mb={"md"} order={1}>
              Links
            </Title>
            <Stack>{linksList}</Stack>
          </Grid.Col>
        </Grid>
        <Title mt={"xl"} mb="xs" order={1}>
          About
        </Title>
        <Card>
          <Text>
            Nebulate is a browser extension that allows you to find Nebula
            content while watching Youtube. It is currently in beta and is not
            affiliated with Nebula.
          </Text>
        </Card>

        {/* Stats */}
        <Title mt={"xl"} mb="xs" order={1}>
          Stats
        </Title>

        <StatsGrid data={stats} />

        <Affix
          position={{
            bottom: 0,
            // Center the footer on the page
            // eslint-disable-next-line no-undef
            right: window.innerWidth / 2 - 100,
          }}
        >
          <Text c="dimmed">
            Made with ❤️ in Toronto 🇨🇦 by{" "}
            <a href="https://github.com/oenu">@oenu</a>
          </Text>
        </Affix>
      </Stack>
    </Container>
  );
}
