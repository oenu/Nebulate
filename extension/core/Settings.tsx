import {
  Anchor,
  Button,
  Card,
  Checkbox,
  Group,
  ScrollArea,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useCallback, useEffect, useState } from 'react';
import { browser } from 'wxt/browser';
import type { Management } from './management';
import { DEFAULT_PREFERENCES } from './preferences';
import { reasonLabel, stateLabel } from './status';
import type { MatchDecision, Preferences } from './types';

type Summary = Awaited<ReturnType<Management['status']>>;
function videoId(value: string): string | undefined {
  if (/^[\w-]{11}$/.test(value)) return value;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' &&
      url.hostname === 'www.youtube.com' &&
      /^[\w-]{11}$/.test(url.searchParams.get('v') ?? '')
      ? (url.searchParams.get('v') ?? undefined)
      : undefined;
  } catch {
    return;
  }
}

export function Settings() {
  const [summary, setSummary] = useState<Summary>();
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [includeOverrides, setIncludeOverrides] = useState(false);
  const [youtubeURL, setYoutubeURL] = useState('');
  const [nebulaURL, setNebulaURL] = useState('');
  const [reject, setReject] = useState(false);
  const [decision, setDecision] = useState<MatchDecision>();
  const [channelId, setChannelId] = useState('');
  const [handle, setHandle] = useState('');
  const [slug, setSlug] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [creatorSearch, setCreatorSearch] = useState('');
  const load = useCallback(async () => {
    const status = await browser.runtime.sendMessage({ type: 'status' });
    if (!status.error) setSummary(status);
  }, []);
  useEffect(() => {
    void load();
    void browser.runtime.sendMessage({ type: 'preferences' }).then(setPreferences);
    const timer = setInterval(() => void load().catch(() => {}), 5000);
    return () => clearInterval(timer);
  }, [load]);
  const run = async (message: Record<string, unknown>) => {
    setBusy(true);
    setNotice('Working…');
    try {
      const result = await browser.runtime.sendMessage(message);
      if (result.error) {
        setNotice(reasonLabel(result.error));
        return;
      }
      if (result.decision) setDecision(result.decision);
      setNotice(result.job?.error ? reasonLabel(result.job.error) : 'Saved on this device.');
      await load();
    } catch {
      setNotice('The extension is unavailable. Reload it and try again.');
    } finally {
      setBusy(false);
    }
  };
  const currentVideoId = videoId(youtubeURL.trim());
  const toggle = (key: keyof Preferences, checked: boolean) =>
    setPreferences((p) => ({ ...p, [key]: checked }));
  return (
    <Stack>
      <Text role="status">{notice}</Text>
      <Card withBorder>
        <Stack>
          <Title order={2}>Local cache</Title>
          <Text>
            {summary?.matches ?? 0} confirmed matches · {summary?.videos ?? 0} catalogue videos ·{' '}
            {summary?.overrides ?? 0} manual corrections
          </Text>
          <Text size="sm">
            Clearing cached metadata and matches keeps your preferences, creator mappings and
            sign-in session.
          </Text>
          <Checkbox
            label="Also remove manual video corrections"
            checked={includeOverrides}
            onChange={(e) => setIncludeOverrides(e.currentTarget.checked)}
          />
          <Button
            color="orange"
            disabled={busy}
            onClick={() => void run({ type: 'clear-cache', includeOverrides })}
          >
            Clear cached metadata and matches
          </Button>
        </Stack>
      </Card>
      <Card withBorder>
        <Stack>
          <Title order={2}>Appearance and behaviour</Title>
          <Switch
            label="Watch-page rocket button"
            checked={preferences.showVideoButton}
            onChange={(e) => toggle('showVideoButton', e.currentTarget.checked)}
          />
          <Switch
            label="Glow around confirmed watch videos"
            checked={preferences.highlightVideo}
            onChange={(e) => toggle('highlightVideo', e.currentTarget.checked)}
          />
          <Switch
            label="Confirm and highlight browsing cards"
            checked={preferences.thumbnails}
            onChange={(e) => toggle('thumbnails', e.currentTarget.checked)}
          />
          <Switch
            label="Open Nebula in a new tab"
            checked={preferences.preferNewTab}
            onChange={(e) => toggle('preferNewTab', e.currentTarget.checked)}
          />
          <TextInput
            label="Rocket colour"
            type="color"
            value={preferences.buttonColor}
            onChange={(e) => setPreferences((p) => ({ ...p, buttonColor: e.currentTarget.value }))}
          />
          <Button
            disabled={busy}
            onClick={() => void run({ type: 'set-preferences', preferences })}
          >
            Save preferences
          </Button>
        </Stack>
      </Card>
      <Card withBorder>
        <Stack>
          <Title order={2}>Creator refresh</Title>
          <Text size="sm">
            A creator's latest videos are fetched when you encounter their videos, including cached
            matches. Successful fetches are reused for four hours; failures retry with backoff.
            Refreshes use at most five pages of 100 episodes, with restart recovery.
          </Text>
          <Text size="sm">
            {summary?.directory.length ?? 0} Nebula channels · {summary?.creators.length ?? 0}{' '}
            verified YouTube mappings. Directory updated{' '}
            {summary ? new Date(summary.registryUpdatedAtMs).toLocaleDateString() : '…'}. Unmapped
            channels need identity confirmation; some Nebula originals have no YouTube counterpart.
          </Text>
          <TextInput
            label="Find a creator"
            value={creatorSearch}
            onChange={(event) => setCreatorSearch(event.currentTarget.value)}
          />
          <ScrollArea h={360}>
            <Stack>
              {summary?.creators
                .filter(
                  (creator) =>
                    creator.title.toLowerCase().includes(creatorSearch.toLowerCase()) ||
                    creator.slug.includes(creatorSearch.toLowerCase()),
                )
                .map((creator) => {
                  const job = summary.jobs.find((j) => j.slug === creator.slug);
                  return (
                    <Group key={creator.youtubeChannelId} justify="space-between">
                      <div>
                        <Text>{creator.title}</Text>
                        <Text size="sm">
                          {job
                            ? `${job.status} · ${job.pages} page(s)${job.complete ? '' : ' · catalogue may be incomplete'}`
                            : 'Not fetched yet'}
                        </Text>
                        {job?.error && <Text size="sm">{reasonLabel(job.error)}</Text>}
                        {job?.retryAtMs ? (
                          <Text size="sm">
                            Retry after {new Date(job.retryAtMs).toLocaleString()}
                          </Text>
                        ) : null}
                      </div>
                      <Button
                        size="xs"
                        disabled={busy}
                        onClick={() => void run({ type: 'refresh', slug: creator.slug })}
                      >
                        Refresh
                      </Button>
                    </Group>
                  );
                })}
              {summary?.directory
                .filter(
                  (entry) =>
                    !entry.mapped &&
                    (entry.title.toLowerCase().includes(creatorSearch.toLowerCase()) ||
                      entry.slug.includes(creatorSearch.toLowerCase())),
                )
                .map((entry) => (
                  <Group key={entry.id} justify="space-between">
                    <div>
                      <Text>{entry.title}</Text>
                      <Text size="sm">YouTube channel not verified · {entry.slug}</Text>
                    </div>
                    <Button
                      size="xs"
                      variant="subtle"
                      onClick={() => {
                        setSlug(entry.slug);
                        document
                          .getElementById('nebulate-creator-mappings')
                          ?.scrollIntoView({ block: 'start', behavior: 'smooth' });
                      }}
                    >
                      Prepare mapping
                    </Button>
                  </Group>
                ))}
            </Stack>
          </ScrollArea>
        </Stack>
      </Card>
      <Card withBorder>
        <Stack>
          <Title order={2}>Video corrections</Title>
          <TextInput
            label="YouTube watch URL or video ID"
            value={youtubeURL}
            onChange={(e) => {
              setYoutubeURL(e.currentTarget.value);
              setDecision(undefined);
            }}
          />
          <Button
            disabled={busy || !currentVideoId}
            onClick={() => void run({ type: 'inspect-video', videoId: currentVideoId })}
          >
            Check video
          </Button>
          {decision && <Text>{stateLabel(decision.state)}</Text>}
          {decision?.candidates?.map((candidate) => (
            <Group key={candidate.id}>
              <Anchor href={candidate.url} target="_blank" rel="noopener noreferrer">
                {candidate.title}
              </Anchor>
              <Button
                size="xs"
                variant="subtle"
                onClick={() => {
                  setNebulaURL(candidate.url);
                  setReject(false);
                }}
              >
                Use candidate
              </Button>
            </Group>
          ))}
          <Checkbox
            label="This video has no Nebula match (manual exclusion)"
            checked={reject}
            onChange={(e) => setReject(e.currentTarget.checked)}
          />
          {!reject && (
            <TextInput
              label="Canonical Nebula video URL"
              value={nebulaURL}
              onChange={(e) => setNebulaURL(e.currentTarget.value)}
            />
          )}
          <Text size="sm">
            Corrections stay on this device and survive metadata refreshes. A confirmed video must
            belong to the verified creator.
          </Text>
          <Group>
            <Button
              disabled={busy || !currentVideoId || (!reject && !nebulaURL)}
              onClick={() =>
                void run({
                  type: 'correct-video',
                  videoId: currentVideoId,
                  nebulaURL: reject ? null : nebulaURL.trim(),
                })
              }
            >
              Save correction
            </Button>
            <Button
              variant="subtle"
              disabled={busy || !currentVideoId}
              onClick={() => void run({ type: 'forget-correction', videoId: currentVideoId })}
            >
              Remove correction
            </Button>
          </Group>
        </Stack>
      </Card>
      <Card withBorder id="nebulate-creator-mappings">
        <Stack>
          <Title order={2}>Creator mappings</Title>
          <Text size="sm">
            Add or correct a mapping after verifying both channels identify the same creator.
            Historical mappings are never imported automatically.
          </Text>
          <TextInput
            label="YouTube channel ID (UC…)"
            value={channelId}
            onChange={(e) => setChannelId(e.currentTarget.value)}
          />
          <TextInput
            label="YouTube handle (@…)"
            value={handle}
            onChange={(e) => setHandle(e.currentTarget.value)}
          />
          <TextInput
            label="Nebula creator slug"
            value={slug}
            onChange={(e) => setSlug(e.currentTarget.value)}
          />
          <Checkbox
            label="I verified that these channels identify the same creator"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.currentTarget.checked)}
          />
          <Button
            disabled={busy || !confirmed || !channelId || !handle || !slug}
            onClick={() =>
              void run({
                type: 'map-creator',
                channelId: channelId.trim(),
                handle: handle.trim(),
                slug: slug.trim(),
                confirmed,
              })
            }
          >
            Save verified mapping
          </Button>
        </Stack>
      </Card>
      <Card withBorder>
        <Stack>
          <Title order={2}>Recent checks</Title>
          {summary?.recent.map((item) => (
            <Text key={item.videoId} size="sm">
              {item.videoId}: {stateLabel(item.state)}
            </Text>
          ))}
        </Stack>
      </Card>
    </Stack>
  );
}
