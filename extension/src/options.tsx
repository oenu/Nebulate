// Placeholder
import {
  Loader,
  Button,
  Card,
  ColorPicker,
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
  TextInput,
  Title,
  Center,
  LoadingOverlay,
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
import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { Messages } from "./common/enums";
import { TableSummary } from "./background/table/summarizeTable";
import { PopupRedirectMessage } from "./popup";
import { PopupSummarizeMessageResponse } from "./popup";
import { allOptions, optionUtilityType } from "./common/options";
const optionRedirect = (url: string): void => {
  console.debug("Redirecting to url " + url);

  const message: PopupRedirectMessage = {
    type: Messages.POPUP_REDIRECT,
    url,
  };

  chrome.runtime.sendMessage(message);
};

// Options enum
export enum OptionId {
  // eslint-disable-next-line no-unused-vars
  OPEN_IN_NEW_TAB = "newTab",
  // eslint-disable-next-line no-unused-vars
  HIGHLIGHT_VIDEO = "videoGlow",
  // eslint-disable-next-line no-unused-vars
  HIGHLIGHT_CHANNEL = "channelGlow",
  // eslint-disable-next-line no-unused-vars
  BULK_COLOR = "bulkColor",
  // eslint-disable-next-line no-unused-vars
  ADD_VIDEO_BUTTON = "videoButton",
  // eslint-disable-next-line no-unused-vars
  ADD_CHANNEL_BUTTON = "channelButton",
  // eslint-disable-next-line no-unused-vars
  SHOW_ON_VIDEO = "videoShow",
  // eslint-disable-next-line no-unused-vars
  SHOW_ON_SUBSCRIPTIONS = "subscriptionsShow",
  // eslint-disable-next-line no-unused-vars
  SHOW_ON_HOME = "homeShow",
  // eslint-disable-next-line no-unused-vars
  GRADIENT_START = "gradientStart",
  // eslint-disable-next-line no-unused-vars
  GRADIENT_END = "gradientEnd",
}

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

interface StatsGridProps {
  data: {
    title: string;
    icon: TablerIcon;
    description: string;
    value: string;
  }[];
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function Options() {
  const [tableSummary, setTableSummary] = React.useState<TableSummary>();
  const [optionsLoaded, setOptionsLoaded] = React.useState(false);
  const [optionValues, setOptionValues] =
    React.useState<optionUtilityType>(allOptions);

  useEffect(() => {
    // Listen for changes to options
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.options) {
        // Check if the options have changed
        if (changes.options.newValue === changes.options.oldValue) {
          console.debug("Options have not changed");
          return;
        }

        console.log("Options changed");
        console.log(changes.options.newValue);

        const newOptions = changes.options.newValue;
        const newOptionValues = { ...optionValues };
        Object.keys(newOptions).forEach((key) => {
          const option = key as OptionId;
          newOptionValues[option].value = newOptions[option];
        });
        setOptionValues(newOptionValues);
      }
    });

    // Listen for summary message
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === Messages.SUMMARIZE_TABLE_RESPONSE) {
        const response = message as PopupSummarizeMessageResponse;
        setTableSummary(response.table);
      }
    });

    // On page load, get the options and set them
    chrome.storage.local.get("options", (result) => {
      console.log("Options loaded:");
      console.log(result);
      const newOptionValues = { ...optionValues };
      Object.keys(result.options).forEach((key) => {
        const option = key as OptionId;
        newOptionValues[option].value = result.options[option];
      });
      setOptionValues(newOptionValues);
      setOptionsLoaded(true);
    });

    getTableSummary();
  }, []);

  // ================== Options ==================
  // Get options from storage

  // Set the options in individual state variables and defaults

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
      value: tableSummary?.totalChannels.toString() ?? "N/A",
      icon: IconUser,
    },
    {
      title: "YouTube Videos",
      description: "Number of YouTube videos that have no match on Nebula",
      value: tableSummary?.totalVideos.toString() ?? "N/A",
      icon: IconBrandYoutube,
    },
    {
      title: "Matched Videos",
      description: "Number of videos that are available on Nebula and YouTube",
      value: tableSummary?.totalMatches.toString() ?? "N/A",
      icon: IconCheck,
    },
    {
      title: "Unmatched Videos",
      description: "Number of videos that have no direct match on Nebula",
      value: tableSummary?.totalUnmatched.toString() ?? "N/A",
      icon: IconZoomQuestion,
    },
    {
      title: "Database Generated At",
      description: "Time the last Nebula data file was generated",
      value: tableSummary?.generatedAt.toLocaleString() ?? "N/A",
      icon: IconFileTime,
    },
    {
      title: "Database Last Synced At",
      description: "Time the Nebula data was last synced",
      value:
        // Format better
        tableSummary?.lastUpdated.toLocaleString().replace(", ", " at ") ??
        "N/A",

      icon: IconRefresh,
    },
  ];

  // ================== List Constructors ==================
  const optionsList = Object.entries(allOptions).map(([key, option]) => {
    if (typeof option.value === "boolean") {
      const toggle = (): void => {
        option.callback(!option.value);
        setOptionValues({
          ...optionValues,
          [key]: {
            ...option,
            value: !option.value,
          },
        });
      };

      return (
        <Card key={key}>
          <Text fz={"lg"}> {option.title} </Text>
          <Switch
            checked={option.value}
            onChange={(): void => {
              toggle();
            }}
            label={option.description}
          />
        </Card>
      );
    } else if (typeof option.value === "string") {
      const change = (value: string): void => {
        option.callback(value);
        setOptionValues({
          ...optionValues,
          [key]: {
            ...option,
            value,
          },
        });
      };

      if (key === OptionId.BULK_COLOR) {
        return (
          <Card key={key}>
            <Text fz={"lg"}> {option.title} </Text>
            <ColorPicker
              mt="sm"
              color={option.value}
              swatches={[
                "#3EBBF3", // Default
                "#25262b", // Dark
                "#868e96", // Light
                "#fa5252", // Red
                "#e64980", // Pink
                "#be4bdb", // Purple
                "#7950f2", // Violet
                "#4c6ef5", // Indigo
                "#15aabf", // Cyan
                "#12b886", // Teal
                "#40c057", // Green
                "#82c91e", // Lime
                "#fab005", // Yellow
                "#fd7e14", // Orange
              ]}
              swatchesPerRow={7}
              onChangeEnd={(color: string): void => {
                change(color);
              }}
            />
          </Card>
        );
      } else if (key === OptionId.GRADIENT_START) {
        <Card key={key}>
          <Text fz={"lg"}> {option.title} </Text>
          <ColorPicker
            mt="sm"
            color={option.value}
            swatches={[
              "#3EBBF3", // Default
              "#25262b", // Dark
              "#868e96", // Light
              "#fa5252", // Red
              "#e64980", // Pink
              "#be4bdb", // Purple
              "#7950f2", // Violet
              "#4c6ef5", // Indigo
              "#15aabf", // Cyan
              "#12b886", // Teal
              "#40c057", // Green
              "#82c91e", // Lime
              "#fab005", // Yellow
              "#fd7e14", // Orange
            ]}
            swatchesPerRow={7}
            onChangeEnd={(color: string): void => {
              change(color);
            }}
          />
          <ColorPicker
            mt="sm"
            color={optionValues[OptionId.GRADIENT_END].value as string}
            swatches={[
              "#5850D1", // Default
              "#25262b", // Dark
              "#868e96", // Light
              "#fa5252", // Red
              "#e64980", // Pink
              "#be4bdb", // Purple
              "#7950f2", // Violet
              "#4c6ef5", // Indigo
              "#15aabf", // Cyan
              "#12b886", // Teal
              "#40c057", // Green
              "#82c91e", // Lime
              "#fab005", // Yellow
              "#fd7e14", // Orange
            ]}
            swatchesPerRow={7}
            onChangeEnd={(color: string): void => {
              change(color);
            }}
          />
        </Card>;
      } else if (key === OptionId.GRADIENT_END) {
        return null;
      } else {
        return (
          <Card key={key}>
            <Text fz={"lg"}> {option.title} </Text>

            <TextInput
              value={option.value}
              onChange={(e): void => {
                change(e.target.value);
              }}
              label={option.description}
            />
          </Card>
        );
      }
    }
  });

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

  // ================== Render ==================
  return (
    <Container size={"xl"}>
      <Stack spacing={"md"}>
        <Center>
          <Text c="dimmed">
            Made with ❤️ in Toronto 🇨🇦 by{" "}
            <a href="https://github.com/oenu">@oenu</a>
          </Text>
        </Center>
        <Title mt={"md"} mb="xs" order={1}>
          Stats
        </Title>
        <StatsGrid data={stats} />
        <Grid>
          <Grid.Col lg={6} md={6} sm={12} xs={12}>
            <Title mt={"xl"} mb={"md"} order={1}>
              Options
            </Title>
            <Stack>
              <LoadingOverlay visible={!optionsLoaded} />
              {optionsList}
            </Stack>
          </Grid.Col>
          <Grid.Col lg={6} md={6} sm={12} xs={12}>
            <Title mt={"xl"} mb={"md"} order={1}>
              Links
            </Title>
            <Stack>{linksList}</Stack>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
}

/**
 * Trigger a summary update (will return a message that can be listened for)
 */
const getTableSummary = (): void => {
  console.log("Getting table summary");
  chrome.runtime.sendMessage({
    type: Messages.SUMMARIZE_TABLE,
  });
};

// ================== Stat Grid ==================
// eslint-disable-next-line no-undef
const StatsGrid = ({ data }: StatsGridProps): JSX.Element => {
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
  const { classes } = useStyles();

  const stats = data.map((stat) => {
    const Icon = stat.icon;
    if (stat.value === "N/A") {
      return (
        <Paper withBorder p="md" radius="md" key={stat.title}>
          <Group position="apart">
            <Text size="xs" color="dimmed" className={classes.title}>
              {stat.title}
            </Text>
            <Icon className={classes.icon} size={22} stroke={1.5} />
          </Group>

          <Group align="flex-end" spacing="xs" mt={25}>
            <Text className={classes.value}>
              <Loader size="md" />
            </Text>
          </Group>

          <Text size="xs" color="dimmed" mt={7}>
            {stat.description}
          </Text>
        </Paper>
      );
    } else {
      return (
        <Paper withBorder p="md" radius="md" key={stat.title}>
          <Group position="apart">
            <Text size="xs" color="dimmed" className={classes.title}>
              {stat.title}
            </Text>
            <Icon className={classes.icon} size={22} stroke={1.5} />
          </Group>

          <Group align="flex-end" spacing="xs" mt={25}>
            <Text className={classes.value}>
              {/* If value is a date, convert to string */}
              {stat.description.match(/time/i)
                ? new Date(stat.value).toLocaleString()
                : stat.value}
              {/* {stat.value} */}
            </Text>
          </Group>

          <Text size="xs" color="dimmed" mt={7}>
            {stat.description}
          </Text>
        </Paper>
      );
    }
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

// ================== Render ==================
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
