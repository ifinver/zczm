import React, { useEffect, useState } from 'react';
import { ApiUrlConsumer, LinksConsumer } from '../utils/contexts/';
import { PageStore } from '../utils/stores/';
import { MediaListRow } from '../components/MediaListRow';
import { MediaMultiListWrapper } from '../components/MediaMultiListWrapper';
import { ItemListAsync } from '../components/item-list/ItemListAsync.jsx';
import { InlineSliderItemListAsync } from '../components/item-list/InlineSliderItemListAsync.jsx';
import { Page } from './Page';
import { translateString } from '../utils/helpers/';
import Banner from '../components/Banner';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/autoplay';
import './nav.css';
import { Autoplay, Navigation } from 'swiper/modules';
import { LazyLoadItemListAsync } from '../components/item-list/LazyLoadItemListAsync';

const EmptyMedia: React.FC = ({}) => {
  return (
    <LinksConsumer>
      {(links) => (
        <div className="empty-media">
          <div className="welcome-title">Welcome to 眾創之門!</div>
          <div className="start-uploading">Start uploading media and sharing your work!</div>
          <a href={links.user.addMedia} title="Upload media" className="button-link">
            <i className="material-icons" data-icon="video_call"></i>UPLOAD MEDIA
          </a>
        </div>
      )}
    </LinksConsumer>
  );
};

interface HomePageProps {
  id?: string;
  latest_title: string;
  featured_title: string;
  recommended_title: string;
  latest_view_all_link: boolean;
  featured_view_all_link: boolean;
  recommended_view_all_link: boolean;
}

export const HomePage: React.FC<HomePageProps> = ({
  id = 'home',
  //featured_title = PageStore.get('config-options').pages.home.sections.featured.title,
  //recommended_title = PageStore.get('config-options').pages.home.sections.recommended.title,
  //latest_title = PageStore.get('config-options').pages.home.sections.latest.title,
  featured_title = translateString('Featured'),
  recommended_title = translateString('Recommended'),
  latest_title = translateString('Latest'),
  latest_view_all_link = false,
  featured_view_all_link = true,
  recommended_view_all_link = true,
}) => {
  const [zeroMedia, setZeroMedia] = useState(false);
  const [visibleLatest, setVisibleLatest] = useState(false);
  const [visibleFeatured, setVisibleFeatured] = useState(false);
  const [visibleRecommended, setVisibleRecommended] = useState(false);
  const [navItems, setNavItems] = useState<{ title: string; icon: string; url: string }[]>([]);

  const onLoadLatest = (length: number) => {
    setVisibleLatest(0 < length);
    setZeroMedia(0 === length);
  };

  const onLoadFeatured = (length: number) => {
    setVisibleFeatured(0 < length);
  };

  const onLoadRecommended = (length: number) => {
    setVisibleRecommended(0 < length);
  };

  // Fetch navigation data
  useEffect(() => {
    fetch('/static/nav.json')
      .then((response) => response.json())
      .then((data) => setNavItems(data));
  }, []);


  return (
    <Page id={id}>

      <Banner />
      {navItems.length > 0 && (
        <div id="navbar-container">
          <Swiper
            modules={[Navigation, Autoplay]}
            loop={true} // Enable infinite loop
            autoplay={{
              delay: 3000, // Automatic slide every 3 seconds
              disableOnInteraction: false, // Pause autoplay on interaction
            }}
            slidesPerView="auto" // Dynamically calculate visible slides
            slidesPerGroup={1} 
            spaceBetween={69} // Space between slides
          >
            {navItems.map((item, index) => (
              <SwiperSlide key={index} style={{ width: 'auto' }}>
                <div className="nav-item">
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    <img src={item.icon} alt={item.title} />
                    <p>{item.title}</p>
                  </a>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}

      <LinksConsumer>
        {(links) => (
          <ApiUrlConsumer>
            {(apiUrl) => (
              <MediaMultiListWrapper className="items-list-ver">
                {PageStore.get('config-enabled').pages.featured &&
                  PageStore.get('config-enabled').pages.featured.enabled && (
                    <MediaListRow
                      title={featured_title}
                      style={!visibleFeatured ? { display: 'none' } : undefined}
                      viewAllLink={featured_view_all_link ? links.featured : null}
                    >
                      <InlineSliderItemListAsync
                        requestUrl={apiUrl.featured}
                        itemsCountCallback={onLoadFeatured}
                        hideViews={!PageStore.get('config-media-item').displayViews}
                        hideAuthor={!PageStore.get('config-media-item').displayAuthor}
                        hideDate={!PageStore.get('config-media-item').displayPublishDate}
                      />
                    </MediaListRow>
                  )}

                {PageStore.get('config-enabled').pages.recommended &&
                  PageStore.get('config-enabled').pages.recommended.enabled && (
                    <MediaListRow
                      title={recommended_title}
                      style={!visibleRecommended ? { display: 'none' } : undefined}
                      viewAllLink={recommended_view_all_link ? links.recommended : null}
                    >
                      <InlineSliderItemListAsync
                        requestUrl={apiUrl.recommended}
                        itemsCountCallback={onLoadRecommended}
                        hideViews={!PageStore.get('config-media-item').displayViews}
                        hideAuthor={!PageStore.get('config-media-item').displayAuthor}
                        hideDate={!PageStore.get('config-media-item').displayPublishDate}
                      />
                    </MediaListRow>
                  )}

                <MediaListRow
                  title="剧集"
                  style={undefined}
                  viewAllLink={undefined}>

                  <LazyLoadItemListAsync
                    requestUrl={`${apiUrl.user.playlists}admin`}
                    hideViews={!PageStore.get('config-media-item').displayViews}
                    hideAuthor={!PageStore.get('config-media-item').displayAuthor}
                    hideDate={!PageStore.get('config-media-item').displayPublishDate}/>
                </MediaListRow>

                <MediaListRow
                  title={latest_title}
                  style={!visibleLatest ? { display: 'none' } : undefined}
                  viewAllLink={latest_view_all_link ? links.latest : null}
                >
                  <ItemListAsync
                    pageItems={30}
                    requestUrl={apiUrl.media}
                    itemsCountCallback={onLoadLatest}
                    hideViews={!PageStore.get('config-media-item').displayViews}
                    hideAuthor={!PageStore.get('config-media-item').displayAuthor}
                    hideDate={!PageStore.get('config-media-item').displayPublishDate}
                  />
                </MediaListRow>

                {zeroMedia && <EmptyMedia />}
              </MediaMultiListWrapper>
            )}
          </ApiUrlConsumer>
        )}
      </LinksConsumer>
    </Page>
  );
};
