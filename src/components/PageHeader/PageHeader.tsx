import { faAngleDown, faAngleUp } from '@fortawesome/free-solid-svg-icons'
import classnames from 'classnames'
import { useTranslation } from 'react-i18next'
import { ButtonRectangle, DivClickable, Dropdown, Icon } from '~/components'

type Props = {
  handleClearAllButton?: any
  handleCollapse?: any
  handleEditButton?: any
  hasEditButton?: boolean
  isCollapsed?: boolean
  isEditing?: boolean
  isSubHeader?: boolean
  noMarginBottom?: boolean
  primaryOnChange?: any
  primaryOptions?: any[]
  primarySelected?: string
  sortOptions?: any[]
  sortOnChange?: any
  sortSelected?: string
  text: string
}

export const PageHeader = ({
  handleClearAllButton,
  handleCollapse,
  handleEditButton,
  hasEditButton,
  isCollapsed,
  isEditing,
  isSubHeader,
  noMarginBottom,
  primaryOnChange,
  primaryOptions,
  primarySelected,
  sortOnChange,
  sortOptions,
  sortSelected,
  text
}: Props) => {
  const { t } = useTranslation()
  const wrapperClass = classnames(
    'page-header',
    isSubHeader ? 'sub-header' : '',
    noMarginBottom ? 'no-margin-bottom' : ''
  )
  const hrClassName = classnames('page-header-hr', noMarginBottom ? 'no-margin-bottom' : '')
  const hasDropdowns = !!(sortOptions?.length || primaryOptions?.length)
  const hasButtons = hasEditButton
  const caretIcon = (
    <div className='header-caret'>
      <Icon faIcon={isCollapsed ? faAngleDown : faAngleUp} />
    </div>
  )

  return (
    <>
      <div className={wrapperClass}>
        <div className='main-max-width'>
          <DivClickable className='page-header-title-wrapper' onClick={handleCollapse}>
            {!isSubHeader && <h1>{text}</h1>}
            {isSubHeader && <h2>{text}</h2>}
            {handleCollapse && caretIcon}
          </DivClickable>
          {hasDropdowns && (
            <div className='dropdowns'>
              {primaryOptions?.length && (
                <div className='dropdown-primary-wrapper'>
                  <Dropdown
                    dropdownWidthClass='width-small'
                    onChange={primaryOnChange}
                    options={primaryOptions}
                    outlineStyle
                    selectedKey={primarySelected}
                  />
                </div>
              )}
              {sortOptions?.length && (
                <div className='dropdown-sort-wrapper'>
                  <Dropdown
                    dropdownWidthClass='width-medium'
                    onChange={sortOnChange}
                    options={sortOptions}
                    outlineStyle
                    selectedKey={sortSelected}
                  />
                </div>
              )}
            </div>
          )}
          {hasButtons && (
            <div className='buttons'>
              {isEditing && <ButtonRectangle label={t('Remove All')} onClick={handleClearAllButton} type='tertiary' />}
              {hasEditButton && (
                <ButtonRectangle label={isEditing ? t('Done') : t('Edit')} onClick={handleEditButton} type='tertiary' />
              )}
            </div>
          )}
        </div>
      </div>
      {!isSubHeader && <hr className={hrClassName} />}
    </>
  )
}
