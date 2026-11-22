import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MovieSearch from './MovieSearch';
import './Searchbar.css';

export default function Searchbar() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return <div className="nav-movie-search"><MovieSearch id="global-movie-search" label={t('search')}
    onSelect={movie => navigate(`/movie/${movie.id}`)} /></div>;
}
