import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/autoplay';
import './Banner.css';

// 导入 Swiper 模块
import { Autoplay, Pagination } from 'swiper/modules';

const Banner: React.FC = () => {
  const banners = [
    { text: '为什么会有人类', 
      image: '/media/original/thumbnails/user/admin/0b70b9c8c8c44328ad20b455fb139980.id13923391ChineseETtopbanner.png_MUt9W9b.jpg',
      url: '/view?m=ynHygTPOH' },
    { text: '点击观看《沉默呼声》', 
      image: '/media/original/thumbnails/user/admin/a546d228146c45589a73f694f887e12f.photo_20240720_204507.jpg_qfdkPE2.jpg',
      url: '/view?m=cEOJCmp5I'  },
    { text: '不为人知的马克思', 
      image: '/media/original/thumbnails/user/admin/94d7a2a4c4c04097a4e6a53cc2ce6c24.images.jpg_d4NxPZz.jpg',
      url: '/playlists/CBLanWo5S'  },
  ];

  const handleBannerClick = (url: string) => {
    window.location.href = url;
  };

  return (
    <div className="banner-container">
      <Swiper
        modules={[Autoplay, Pagination]} // 使用 Autoplay 和 Pagination 模块
        autoplay={{ delay: 3000 }}
        loop={true}
        pagination={{ clickable: true }}
        className="swiper-container"
      >
        {banners.map((banner, index) => (
          <SwiperSlide key={index}>
            <div 
              className="banner-slide"
              onClick={() => handleBannerClick(banner.url)}>
              <img src={banner.image} alt={banner.text} className="banner-image" />
              <div className="banner-text">{banner.text}</div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default Banner;
