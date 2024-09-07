import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CardMedia,
  Container,
  FormControl,
  Unstable_Grid2 as Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Iframe from 'src/components/Iframe';
import ProtectDashboard from 'src/hocs/protectDashboard';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { getResourse } from 'src/lib/actions';

const Page = ({ adAccounts, adAccount, ads }) => {
  const { query, replace } = useRouter();

  const handleSelectChange = (event) => {
    replace(`/ad-account/${event.target.value}`);
  };

  const adsList = ads.adsUpload || [];

  return (
    <>
      <Head>
        <title>Ad Account - {adAccount.name} | Devias Kit</title>
      </Head>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: 8,
        }}
      >
        <Container maxWidth="xl">
          <Stack spacing={3}>
            <Typography variant="h4">Ad Account - {adAccount.name}</Typography>
            <Grid container spacing={3}>
              <Grid xs={12} sm={6} lg={4}>
                <FormControl fullWidth>
                  <InputLabel id="scrren-select-label">Select Screen</InputLabel>
                  <Select
                    id="screen-select"
                    labelId="scrren-select-label"
                    label="Select Screen"
                    value={query.ad_account_id}
                    onChange={handleSelectChange}
                  >
                    {adAccounts.list.map((item) => (
                      <MenuItem key={item.reference} value={item.reference}>
                        {item.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid xs={12}>
                <Card>
                  <CardHeader
                    title="Ads"
                    action={
                      <Stack spacing={1} direction="row">
                        <Link href="/campaign/edit-campaign">
                          <Button>Edit Campaign</Button>
                        </Link>
                      </Stack>
                    }
                  />
                  <CardContent>
                    {adsList.length === 0 && <Typography>No ads</Typography>}
                    <Grid container spacing={3}>
                      {adsList.map((adFile) => (
                        <Grid xs={12} sm={6} lg={4} key={adFile.reference}>
                          <Card>
                            {adFile.type === 'html' ? (
                              <Iframe content={adFile.url} />
                            ) : (
                              <CardMedia
                                sx={{ height: 140 }}
                                image={adFile.url}
                                title={adFile.name}
                                component={componentToAdTypeMap[adFile.type]}
                              />
                            )}
                            <CardHeader sx={{ py: 1 }} title={adFile.name} />
                            <CardActions>
                              <Link href={`/campaign/edit-ad/${adAccount.reference}`}>
                                <Button>Edit</Button>
                              </Link>
                              <Button color="error">Delete</Button>
                            </CardActions>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Stack>
        </Container>
      </Box>
    </>
  );
};

const componentToAdTypeMap = {
  image: 'img',
  video: 'video',
  html: 'iframe',
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;

export const getServerSideProps = ProtectDashboard(async (ctx) => {
  try {
    const [adAccounts, adAccount, ads] = await Promise.all([
      getResourse(ctx.req, '/ads-account'),
      getResourse(ctx.req, `/ads-account/${ctx.query.ad_account_id}`),
      getResourse(ctx.req, `/ads/account/${ctx.query.ad_account_id}`),
    ]);

    return {
      props: {
        adAccounts,
        adAccount,
        ads,
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
