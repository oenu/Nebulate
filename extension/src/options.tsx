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
  Image,
  Divider,
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
import { getOptions, optionUtilityType } from "./common/options";
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
  // eslint-disable-next-line no-unused-vars
  BUTTON_COLOR = "buttonColor",
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
  const [optionValues, setOptionValues] = React.useState<optionUtilityType>();

  useEffect(() => {
    // Start listening for changes to options
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.options) {
        // Check if the options have changed
        if (changes.options.newValue === changes.options.oldValue) {
          console.debug("Options have not changed");
          return;
        } else {
          console.debug("Options have changed");
          // Update the options
          setOptionValues(changes.options.newValue);
        }
      }
    });

    // Listen for summary message
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === Messages.SUMMARIZE_TABLE_RESPONSE) {
        const response = message as PopupSummarizeMessageResponse;
        setTableSummary(response.table);
      }
    });

    // On page load, get the options from storage and set them in local state
    chrome.storage.local.get("options", (result) => {
      console.log("Getting options on page load");
      console.log("Existing Options");
      console.table(result.options);

      if (result.options) {
        setOptionValues(result.options);
      } else {
        console.error("No options found in storage");
      }

      setOptionsLoaded(true);
    });

    getTableSummary();
  }, []);

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

  // ================== Functions ==================

  const toggleOption = async (key: keyof optionUtilityType): Promise<void> => {
    // IMPORTANT: the options are stored in an object with the type of { [key: string]: {title, description, value} }

    // Get the current value of the option from storage
    const currentOptions = await getOptions();

    // Create a new object with the updated value
    const newOptions = {
      ...currentOptions,
      [key]: {
        title: currentOptions[key].title,
        description: currentOptions[key].description,
        value: !currentOptions[key].value,
      },
    };

    // Update the options in storage
    await chrome.storage.local.set({ options: newOptions });

    // Update the options in local state
    setOptionValues(newOptions);

    console.log(
      `Toggled option ${key} from ${currentOptions[key].value} to ${newOptions[key].value}`
    );
  };

  const setStringOption = async (
    key: keyof optionUtilityType,
    value: string
  ): Promise<void> => {
    // Get the current value of the option from storage
    const currentOptions = await getOptions();

    // Create a new object with the new value
    const newOptions = {
      ...currentOptions,
      [key]: {
        title: currentOptions[key].title,
        description: currentOptions[key].description,
        value,
      },
    };

    // Update the options in storage
    await chrome.storage.local.set({ options: newOptions });

    // Update the options in local state
    setOptionValues(newOptions);

    console.log(
      `Set string option ${key} from ${currentOptions[key].value} to ${newOptions[key].value}`
    );
  };

  // ================== List Constructors ==================

  const optionsList = (options: optionUtilityType): React.ReactNode => {
    // Generate an array of options including all their values (title, description, value, etc)
    const optionsArray = Object.entries(options).map(([key, value]) => {
      console.log(
        `Option: ${key} - Value: ${value.value} - Title: ${value.title} - Description: ${value.description}`
      );
      return {
        key: key as keyof optionUtilityType,
        title: value.title,
        description: value.description,
        booleanValue:
          typeof value.value === "boolean" ? value.value : undefined,
        stringValue: typeof value.value === "string" ? value.value : undefined,
      };
    });

    // Create a map to order the options
    const optionOrderMap: Record<OptionId, number> = {
      [OptionId.OPEN_IN_NEW_TAB]: 0,
      [OptionId.GRADIENT_START]: 1,
      [OptionId.GRADIENT_END]: 2,
      [OptionId.HIGHLIGHT_VIDEO]: 3,
      [OptionId.HIGHLIGHT_CHANNEL]: 4,
      [OptionId.BUTTON_COLOR]: 5,
      [OptionId.ADD_VIDEO_BUTTON]: 6,
      [OptionId.ADD_CHANNEL_BUTTON]: 7,
      [OptionId.BULK_COLOR]: 8,
      [OptionId.SHOW_ON_HOME]: 9,
      [OptionId.SHOW_ON_SUBSCRIPTIONS]: 10,
      [OptionId.SHOW_ON_VIDEO]: 11,
    };

    // Sort the options by the order map
    const sortedOptions = optionsArray.sort(
      (a, b) => optionOrderMap[a.key] - optionOrderMap[b.key]
    );

    // Create the list of options
    const optionElements = sortedOptions.map((option) => {
      if (option.booleanValue !== undefined) {
        // Boolean option
        return (
          <Card key={option.key}>
            <Text fz={"lg"}> {option.title} </Text>
            <Divider mt={"sm"} />
            <Switch
              checked={option.booleanValue}
              onChange={(): void => {
                // Toggle the option
                toggleOption(option.key);
              }}
              label={option.description}
            />
          </Card>
        );
      } else if (option.stringValue !== undefined) {
        // Special cases for the color pickers
        if (option.key === OptionId.BULK_COLOR) {
          return (
            <Card key={option.key}>
              <Text fz={"lg"}> {option.title} </Text>
              <Divider mt={"sm"} />
              <Group position="center" spacing={40}>
                <ColorPicker
                  mt="sm"
                  color={option.stringValue}
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
                    setStringOption(option.key, color);
                  }}
                />
                <Stack>
                  <Image
                    src="http://placekitten.com/280/158"
                    alt="Example of a styled thumbnail"
                    width="280px"
                    height="150px"
                    style={{
                      boxShadow: `0 0 0 4px ${option.stringValue}`,
                      borderRadius: "4px",
                    }}
                  />
                  <Text
                    style={{
                      color: option.stringValue,
                    }}
                  >
                    I can has nebula video?
                  </Text>
                </Stack>
              </Group>
            </Card>
          );
        } else if (option.key === OptionId.GRADIENT_START) {
          // Special case for the gradient picker, it has two values (start and end) so we skip the end one later
          return (
            <Card
              key={option.key}
              //  box-shadow: -10px 0 20px rgb(62, 187, 243), 10px 0 20px rgb(88, 80, 209); }`;
              style={{
                boxShadow: `-10px 0 20px ${option.stringValue}, 10px 0 20px ${
                  options[OptionId.GRADIENT_END].value
                }`,
              }}
            >
              <Text fz={"lg"}>Video Card Gradient</Text>
              <Divider mt={"sm"} />
              <Center>
                <Group>
                  <ColorPicker
                    mt="sm"
                    color={option.stringValue}
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
                      setStringOption(option.key, color);
                    }}
                  />
                  <ColorPicker
                    mt="sm"
                    color={options[OptionId.GRADIENT_END].value as string}
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
                      setStringOption(OptionId.GRADIENT_END, color);
                    }}
                  />
                </Group>
              </Center>
            </Card>
          );
        } else if (option.key === OptionId.GRADIENT_END) {
          // Skip the end color picker, we already did it above
          return null;
        } else if (option.key === OptionId.BUTTON_COLOR) {
          return (
            <Card key={option.key}>
              <Text fz={"lg"}> {option.title} </Text>
              <Divider mt={"sm"} />
              <Group position="center" spacing={40}>
                <ColorPicker
                  mt="sm"
                  color={option.stringValue}
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
                    setStringOption(option.key, color);
                  }}
                />
                {/* Example of the nebula button (png that needs to be recolored) */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  // class="icon icon-tabler icon-tabler-rocket"
                  width="54"
                  height="54"
                  viewBox="0 0 24 24"
                  stroke-width="2"
                  stroke={option.stringValue}
                  fill="none"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M4 13a8 8 0 0 1 7 7a6 6 0 0 0 3 -5a9 9 0 0 0 6 -8a3 3 0 0 0 -3 -3a9 9 0 0 0 -8 6a6 6 0 0 0 -5 3" />
                  <path d="M7 14a6 6 0 0 0 -3 6a6 6 0 0 0 6 -3" />
                  <circle cx="15" cy="9" r="1" />
                </svg>
              </Group>
            </Card>
          );
        } else {
          // Res of the string options
          return (
            <Card key={option.key}>
              <Text fz={"lg"}> {option.title} </Text>

              <TextInput
                mt="sm"
                value={option.stringValue}
                onChange={(e): void => {
                  setStringOption(option.key, e.target.value);
                }}
                label={option.description}
              />
            </Card>
          );
        }
      }
    });

    if (optionElements) {
      // Divider after newTab
      // Divider before button color, gradient start, bulkColor
      const optionsWithDividers = optionElements.map((optionElement) => {
        if (
          optionElement?.key === OptionId.BUTTON_COLOR ||
          optionElement?.key === OptionId.GRADIENT_START ||
          optionElement?.key === OptionId.BULK_COLOR
        ) {
          return (
            <>
              <Divider />
              {optionElement}
            </>
          );
        } else {
          return optionElement;
        }
      });

      return optionsWithDividers;
    } else {
      return <Loader />;
    }
  };

  const renderOptions = (): React.ReactNode => {
    if (optionValues) {
      if (Object.keys(optionValues).length > 0) {
        console.log("Rendering options");
        console.log(optionValues);

        return optionsList(optionValues);
      }
    } else {
      return <Loader />;
    }
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
              {renderOptions()}
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
