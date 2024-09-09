import { Campaign, Upload } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardHeader,
  Container,
  Divider,
  FormControl,
  Unstable_Grid2 as Grid,
  InputLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListSubheader,
  MenuItem,
  Pagination,
  Select,
  SvgIcon,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
import toast from 'react-hot-toast';
import ProtectDashboard from 'src/hocs/protectDashboard';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { getResourse } from 'src/lib/actions';

function groupLogsByDate(logs, dateKey) {
  const grouped = logs.reduce((acc, log) => {
    const date = log[dateKey || 'playAt'].split(' ')[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(log);
    return acc;
  }, {});

  return Object.keys(grouped).map((date) => ({
    date,
    logs: grouped[date],
  }));
}

const Page = ({ screens, adAccounts, logs }) => {
  const { query, push } = useRouter();
  const [selectedScreen, setSelectedScreen] = useState(query.screen_id || '');
  const [selectedAdAccount, setSelectedAdAccount] = useState(query.account || '');
  const [selectedDate, setSelectedDate] = useState(query.date ? new Date(query.date) : new Date());

  const handleScreenSelect = (event) => {
    setSelectedScreen(event.target.value);
    push(`/device-log/${event.target.value}`);
  };

  const handleAdAccountSelect = (event) => {
    const { value } = event.target;
    setSelectedAdAccount(value);
    const queryParams = new URLSearchParams(query);
    queryParams.delete('screen_id');
    queryParams.set('account', value);
    push(`/device-log/${selectedScreen}?${queryParams.toString()}`);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    const queryParams = new URLSearchParams(query);
    queryParams.set('date', date.toISOString().split('T')[0]);
    queryParams.delete('screen_id');
    push(`/device-log/${selectedScreen}?${queryParams.toString()}`);
  };

  const exportAsCSV = () => {
    if (!selectedScreen) {
      return toast.error('Please select a screen!');
    }
  };

  const hanldePageChange = (_event, value) => {
    const queryParams = new URLSearchParams(query);
    queryParams.delete('screen_id');
    queryParams.set('page', value);
    push(`/device-log/${selectedScreen}?${queryParams.toString()}`);
  };

  const groupedLogs = groupLogsByDate(logs.list);

  return (
    <>
      <Head>
        <title>Generate Report | Devias Kit</title>
      </Head>
      <Box component="main" flexGrow={1} py={2}>
        <Container maxWidth="xl">
          <Grid container spacing={3}>
            <Grid xs={12} sm={6} lg={4}>
              <FormControl fullWidth>
                <InputLabel id="scrren-select-label">Select Screen</InputLabel>
                <Select
                  labelId="scrren-select-label"
                  id="screen-select"
                  name="screenId"
                  value={selectedScreen}
                  label="Select Screen"
                  onChange={handleScreenSelect}
                >
                  {screens.map((screen) => (
                    <MenuItem value={screen.reference} key={screen.reference}>
                      {screen.screenName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid xs={12} sm={6} lg={4}>
              <FormControl fullWidth>
                <InputLabel id="ad-account-select-label">Select Ad Account</InputLabel>
                <Select
                  labelId="ad-account-select-label"
                  id="ad-account-select"
                  value={selectedAdAccount}
                  label="Select Ad Account"
                  onChange={handleAdAccountSelect}
                >
                  {adAccounts.map((adAccount) => (
                    <MenuItem value={adAccount.reference} key={adAccount.reference}>
                      {adAccount.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid xs={12} sm={6} lg={4}>
              <FormControl fullWidth>
                <DatePicker
                  fullWidth
                  label="Select Day"
                  value={selectedDate}
                  onChange={handleDateChange}
                />
              </FormControl>
            </Grid>
            <Grid xs={12}>
              <Button onClick={exportAsCSV} startIcon={<Upload />} variant="contained">
                Export as CSV
              </Button>
            </Grid>
            <Grid xs={12}>
              <ActivityHistory logs={groupedLogs} sx={{ height: '100%' }} />
            </Grid>
            <Grid xs={12}>
              <Pagination
                sx={{ ul: { justifyContent: 'space-between' } }}
                count={Math.ceil(logs.totalRows / +logs.rowsPerPage)}
                siblingCount={4}
                page={parseInt(logs.currentPage)}
                onChange={hanldePageChange}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;

export const getServerSideProps = ProtectDashboard(async (ctx) => {
  const params = {
    ...ctx.query,
    page: ctx.query.page || 1,
    size: ctx.query.size || 25,
    ...(ctx.query.account ? { accountRef: ctx.query.account } : {}),
    ...(ctx.query.date ? { dateSelected: ctx.query.date } : {}),
  };
  try {
    const [screens, adAccounts, logs] = await Promise.all([
      getResourse(ctx.req, `/screen`),
      getResourse(ctx.req, `/ads-account/screen/${ctx.query.screen_id}`),
      getResourse(ctx.req, `/activity/device-log/${ctx.query.screen_id}`, params),
    ]);

    return {
      props: {
        screens: screens.screen,
        adAccounts: adAccounts.list,
        logs,
      },
    };
  } catch (error) {
    console.log(error);

    if (error?.response?.status === 401) {
      return {
        redirect: {
          destination: '/auth/login?auth=false',
          permanent: false,
        },
      };
    }

    return {
      notFound: true,
    };
  }
});

function formatRelativeTime(date) {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const now = new Date();
  const diffInSeconds = Math.floor((date - now) / 1000);

  const units = [
    { unit: 'year', value: 60 * 60 * 24 * 365 }, // Approximation for a year
    { unit: 'month', value: 60 * 60 * 24 * 30 }, // Approximation for a month
    { unit: 'week', value: 60 * 60 * 24 * 7 },
    { unit: 'day', value: 60 * 60 * 24 },
    { unit: 'hour', value: 60 * 60 },
    { unit: 'minute', value: 60 },
    { unit: 'second', value: 1 },
  ];

  for (const { unit, value } of units) {
    if (Math.abs(diffInSeconds) >= value) {
      const amount = Math.floor(diffInSeconds / value);
      return rtf.format(amount, unit);
    }
  }

  return rtf.format(0, 'second'); // Default to "now" if difference is less than a second
}

function ActivityHistory({ logs }) {
  return (
    <Card>
      <CardHeader title={logs.length === 0 ? 'No activity history' : 'Activities'} />
      <List sx={{ maxHeight: '50vh', overflow: 'auto' }} subheader={<li />}>
        {logs.map((log) => (
          <li key={log.date}>
            <ul>
              <ListSubheader>{log.date}</ListSubheader>
              {log.logs.map((_log, index) => {
                const hasDivider = index < history.length - 1;
                const ago = formatRelativeTime(new Date(_log.playAt));
                return (
                  <ListItem divider={hasDivider} key={_log.playAt}>
                    <ListItemAvatar>
                      <SvgIcon>
                        <Campaign />
                      </SvgIcon>
                    </ListItemAvatar>
                    <ListItemText
                      primary={_log.uploadName}
                      primaryTypographyProps={{ variant: 'subtitle1' }}
                      secondary={`${_log.playAt} (${ago})`}
                      secondaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                );
              })}
            </ul>
          </li>
        ))}
      </List>
      <Divider />
    </Card>
  );
}
