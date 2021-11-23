import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import OmniAural, { useOmniAural } from 'omniaural'
import type { Podcast } from 'podverse-shared'
import { useEffect, useRef, useState } from 'react'
import { List, MessageWithAction, PageHeader, PageScrollableContent, Pagination, PodcastListItem,
  scrollToTopOfPageScrollableContent } from '~/components'
import { Page } from '~/lib/utility/page'
import { PV } from '~/resources'
import { getServerSideAuthenticatedUserInfo } from '~/services/auth'
import { getPodcastsByQuery } from '~/services/podcast'
import { getServerSideUserQueueItems } from '~/services/userQueueItem'
import { isNotPodcastsAllSortOption } from '~/resources/Filters'

interface ServerProps extends Page {
  serverFilterFrom: string
  serverFilterPage: number
  serverFilterSort: string
  serverPodcastsListData: Podcast[]
  serverPodcastsListDataCount: number
}

const keyPrefix = 'pages_podcasts'

export default function Podcasts({ serverFilterFrom, serverFilterPage,
  serverFilterSort, serverPodcastsListData, serverPodcastsListDataCount
  }: ServerProps) {

  /* Initialize */

  const router = useRouter()
  const { t } = useTranslation()
  
  const [filterFrom, setFilterFrom] = useState<string>(serverFilterFrom)
  const [filterPage, setFilterPage] = useState<number>(serverFilterPage)
  const [filterSort, setFilterSort] = useState<string>(serverFilterSort)
  const [podcastsListData, setPodcastsListData] =
    useState<Podcast[]>(serverPodcastsListData)
  const [podcastsListDataCount, setPodcastsListDataCount] =
    useState<number>(serverPodcastsListDataCount)
  const [userInfo] = useOmniAural('session.userInfo')

  const initialRender = useRef(true)
  const pageCount = Math.ceil(podcastsListDataCount / PV.Config.QUERY_RESULTS_LIMIT_DEFAULT)
  const pageTitle = router.pathname == PV.RoutePaths.web.podcasts ? t('Podcasts') : t('Podverse')

  /* useEffects */

  useEffect(() => {
    (async () => {
      if (initialRender.current) {
        initialRender.current = false;
      } else {
        OmniAural.pageIsLoadingShow()
        const { data } = await clientQueryPodcasts()
        const [newListData, newListCount] = data
        setPodcastsListData(newListData)
        setPodcastsListDataCount(newListCount)
        scrollToTopOfPageScrollableContent()
        OmniAural.pageIsLoadingHide()
      }
    })()
  }, [filterFrom, filterSort, filterPage])

  /* Client-Side Queries */

  const clientQueryPodcasts = async () => {
    if (filterFrom === PV.Filters.from._all) {
      return clientQueryPodcastsAll()
    } else if (filterFrom === PV.Filters.from._subscribed) {
      return clientQueryPodcastsBySubscribed()
    }
  }

  const clientQueryPodcastsAll = async () => {
    const finalQuery = {
      ...(filterPage ? { page: filterPage } : {}),
      ...(filterSort ? { sort: filterSort } : {})
    }
    return getPodcastsByQuery(finalQuery)
  }

  const clientQueryPodcastsBySubscribed = async () => {
    const subscribedPodcastIds = userInfo?.subscribedPodcastIds || []
    const finalQuery = {
      podcastIds: subscribedPodcastIds,
      ...(filterPage ? { page: filterPage } : {}),
      ...(filterSort ? { sort: filterSort } : {})
    }
    return getPodcastsByQuery(finalQuery)
  }

  /* Function Helpers */

  const _handlePrimaryOnChange = (selectedItems: any[]) => {
    const selectedItem = selectedItems[0]
    if (selectedItem.key !== filterFrom) setFilterPage(1)

    if (
      selectedItem.key !== PV.Filters.from._subscribed
      && isNotPodcastsAllSortOption(filterSort)
    ) {
      setFilterSort(PV.Filters.sort._topPastDay)
    }

    setFilterFrom(selectedItem.key)
  }

  const _handleSortOnChange = (selectedItems: any[]) => {
    const selectedItem = selectedItems[0]
    if (selectedItem.key !== filterSort) setFilterPage(1)
    setFilterSort(selectedItem.key)
  }

  /* Render Helpers */
  
  const generatePodcastListElements = (listItems: Podcast[]) => {
    return listItems.map((listItem, index) =>
      <PodcastListItem
        key={`${keyPrefix}-${index}`}
        podcast={listItem} />
    )
  }

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <PageHeader
        primaryOnChange={_handlePrimaryOnChange}
        primaryOptions={PV.Filters.dropdownOptions.podcasts.from}
        primarySelected={filterFrom}
        sortOnChange={_handleSortOnChange}
        sortOptions={
          filterFrom === PV.Filters.from._subscribed
            ? PV.Filters.dropdownOptions.podcasts.sort.subscribed
            : PV.Filters.dropdownOptions.podcasts.sort.all
        }
        sortSelected={filterSort}
        text={pageTitle} />
      <PageScrollableContent noMarginTop>
        {
          !userInfo && filterFrom === PV.Filters.from._subscribed && (
            <MessageWithAction
              actionLabel={t('Login')}
              actionOnClick={() => OmniAural.modalsLoginShow()}
              message={t('LoginToSubscribeToPodcasts')} />
          )
        }
        {
          userInfo || filterFrom !== PV.Filters.from._subscribed && (
            <>
              <List>
                {generatePodcastListElements(podcastsListData)}
              </List>
              <Pagination
                currentPageIndex={filterPage}
                handlePageNavigate={(newPage) => setFilterPage(newPage)}
                handlePageNext={() => { if (filterPage + 1 <= pageCount) setFilterPage(filterPage + 1) }}
                handlePagePrevious={() => { if (filterPage - 1 > 0) setFilterPage(filterPage - 1) }}
                pageCount={pageCount} />
            </>
          )
        }
      </PageScrollableContent>
    </>
  )
}

/* Server-Side Logic */

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { req, locale } = ctx
  const { cookies } = req

  const userInfo = await getServerSideAuthenticatedUserInfo(cookies)
  const userQueueItems = await getServerSideUserQueueItems(cookies)
  const serverFilterFrom = userInfo ? PV.Filters.from._subscribed : PV.Filters.from._all
  const serverFilterSort = userInfo ? PV.Filters.sort._alphabetical : PV.Filters.sort._topPastDay
  
  const serverFilterPage = 1
  let response = null
  if (userInfo) {
    response = await getPodcastsByQuery({
      podcastIds: userInfo.subscribedPodcastIds,
      sort: serverFilterSort
    })
  } else {
    response = await getPodcastsByQuery({
      sort: serverFilterSort
    })
  }
  
  const [podcastsListData, podcastsListDataCount] = response.data
  
  const serverProps: ServerProps = {
    serverUserInfo: userInfo,
    serverUserQueueItems: userQueueItems,
    ...(await serverSideTranslations(locale, PV.i18n.fileNames.all)),
    serverCookies: cookies,
    serverFilterFrom,
    serverFilterPage,
    serverFilterSort,
    serverPodcastsListData: podcastsListData,
    serverPodcastsListDataCount: podcastsListDataCount
  }

  return { props: serverProps }
}
