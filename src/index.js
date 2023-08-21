import { Notify } from 'notiflix/build/notiflix-notify-aio';
import { Loading } from 'notiflix/build/notiflix-loading-aio';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import { PixabayAPI } from './js/pixabay-api';

const form = document.getElementById('search-form');
const gallery = document.querySelector('.gallery');
const elObserv = document.getElementById('bottom-line');

form.addEventListener('submit', onSubmit);

const lightbox = new SimpleLightbox('.gallery a');

const searchImg = new PixabayAPI();
searchImg.setParams({
  image_type: 'photo',
  orientation: 'horizontal',
  safesearch: true,
  per_page: 40,
});

const options = {
  rootMargin: '750px',
};
const io = new IntersectionObserver(ioHandle, options);

function ioHandle(entries) {
  entries.forEach(async entry => {
    if (entry.isIntersecting) {
      const { hits } = await fetchCard();
      handleResponce(hits);
    }
  });
}

async function onSubmit(e) {
  e.preventDefault();
  io.unobserve(elObserv);
  gallery.innerHTML = '';
  searchImg.setSearchQuestion(e.currentTarget.elements.searchQuery.value);
  const { totalHits, hits } = await fetchCard();
  if (totalHits) {
    Notify.success(`Hooray! We found ${totalHits} images.`);
  }
  io.observe(elObserv);
  handleResponce(hits);
}

async function fetchCard() {
  Loading.circle();
  try {
    const data = await searchImg.search();
    if (data.hits.length === 0)
      throw new Error(
        'Sorry, there are no images matching your search query. Please try again'
      );
    return data;
  } catch (err) {
    Notify.failure(err.message);
  } finally {
    Loading.remove();
  }
}

function handleResponce(data) {
  if (searchImg.currentPage() >= searchImg.totalPage) {
    io.unobserve(elObserv);
    Notify.info(
      "We're sorry, but you've reached the end of search results."
    );
  }
  renderImgCard(data);
  lightbox.refresh();
}

function renderImgCard(arrCard) {
  gallery.insertAdjacentHTML(
    'beforeend',
    arrCard.reduce(
      (
        acc,
        { webformatURL, largeImageURL, tags, likes, views, comments, downloads }
      ) => {
        return (
          acc +
          `
      <div class="photo-card">
      <a href="${largeImageURL}">
            <img src="${webformatURL}" alt="${tags}" loading="lazy" />
            </a>
            <div class="info">
                <p class="info-item">
                <b>Likes</b>${likes}
                </p>
                <p class="info-item">
                <b>Views</b>${views}
                </p>
                <p class="info-item">
                <b>Comments</b>${comments}
                </p>
                <p class="info-item">
                <b>Downloads</b>${downloads}
                </p>
            </div>
        </div>`
        );
      },
      ''
    )
  );
}
