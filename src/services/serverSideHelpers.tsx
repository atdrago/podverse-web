import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { PV } from '~/resources'
import { getServerSideAuthenticatedUserInfo } from '~/services/auth'
import { getServerSideUserQueueItems } from '~/services/userQueueItem'
import { getServerSideHistoryItemsIndex } from '~/services/userHistoryItem'

export const getDefaultServerSideProps = async (ctx: any, locale: any) => {
  const serverCookies = ctx.req.cookies
  const serverHistoryItemsIndex = await getServerSideHistoryItemsIndex(serverCookies)
  const serverUserInfo = await getServerSideAuthenticatedUserInfo(serverCookies)
  const serverUserQueueItems = await getServerSideUserQueueItems(serverCookies)

  return {
    serverCookies,
    ...(await serverSideTranslations(locale, PV.i18n.fileNames.all)),
    serverHistoryItemsIndex,
    serverUserInfo,
    serverUserQueueItems
  }
}
