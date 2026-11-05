/*
 * ONNONO — 설치나 빌드가 필요 없는 JavaScript
 * data.js → app.js 순서로 불러옵니다. file://와 Live Server에서 모두 동작합니다.
 */
(() => {
  'use strict';

  const data = window.ONNONO;
  if (!data) return;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const money = (value) => new Intl.NumberFormat('ko-KR').format(value);
  const page = document.body.dataset.page;
  const params = new URLSearchParams(location.search);
  const allProducts = [...data.products, ...data.saleProducts];
  const findProduct = (id) => allProducts.find((product) => product.id === id);
  const productURL = (id) => `product.html?id=${encodeURIComponent(id)}`;
  const memory = new Map();

  // 일부 브라우저는 로컬 파일에서 저장소를 차단합니다. 이 경우에도 화면은 동작합니다.
  function readStore(key, fallback) {
    try {
      const value = localStorage.getItem(`onnono-${key}`);
      if (value !== null) return JSON.parse(value);
    } catch (_) { /* 현재 탭의 메모리 저장소로 계속 진행 */ }
    return memory.has(key) ? memory.get(key) : fallback;
  }

  function writeStore(key, value) {
    memory.set(key, value);
    try { localStorage.setItem(`onnono-${key}`, JSON.stringify(value)); } catch (_) { /* 저장소 제한 */ }
  }

  const initialSaved = readStore('saved', []);
  let saved = Array.isArray(initialSaved) ? initialSaved.filter((id) => findProduct(id)) : [];
  const initialCart = readStore('cart', []);
  let cart = Array.isArray(initialCart) ? initialCart.filter((item) => item && findProduct(item.id) && Number.isInteger(item.quantity) && item.quantity > 0).map((item) => ({ ...item, quantity: Math.min(item.quantity, 99) })) : [];
  let toastTimer;
  let lightboxItems = [];
  let lightboxIndex = 0;
  let currentProduct;

  function icon(name) {
    return `<img src="assets/icon-${name}.svg" alt="" aria-hidden="true">`;
  }

  function stars() {
    return `<div class="stars" role="img" aria-label="별점 5점">${Array.from({ length: 5 }, () => icon('star')).join('')}</div>`;
  }

  function priceMarkup(product, detail = false) {
    const original = product.originalPrice || (detail && product.id === 'p01' ? 1890000 : 0);
    const price = detail && product.id === 'p01' ? 1285200 : product.price;
    const discount = original ? Math.round((1 - price / original) * 100) : 0;
    return `${original ? `<p class="original-price">${money(original)}원</p>` : ''}<p class="product-price">${discount ? `<small>${discount}%</small>` : ''}<span>${money(price)}<small>원</small></span></p>`;
  }

  function productCard(product) {
    return `<article class="product-card" data-product="${product.id}">
      <div class="product-photo">
        <a href="${productURL(product.id)}" aria-label="${escapeHTML(product.name)} 상품 상세 보기"><img class="product-image" src="${product.image}" alt="${escapeHTML(product.name)}" loading="lazy" width="1254" height="1254"></a>
        <button class="product-save" type="button" data-save="${product.id}" aria-label="${escapeHTML(product.name)} 관심상품" aria-pressed="${saved.includes(product.id)}">${icon('heart')}</button>
      </div>
      <div class="product-info"><h3><a href="${productURL(product.id)}">${escapeHTML(product.name)}</a></h3><p class="product-description">${escapeHTML(product.description)}</p><div>${priceMarkup(product)}</div>${product.originalPrice ? `<span class="mini-heart">${icon('heart')} 100</span>` : ''}</div>
    </article>`;
  }

  const navGroups = [
    { name: 'HOME', href: 'index.html' },
    { name: 'NEW', href: 'shop.html', links: [['신상품 전체', 'shop.html'], ['새로운 컬렉션', 'index.html#edition']] },
    { name: 'SHOP', href: 'shop.html', links: [['전체 상품', 'shop.html'], ['소파', 'shop.html?category=sofa'], ['체어', 'shop.html?category=chair'], ['테이블', 'shop.html?category=table'], ['수납', 'shop.html?category=storage'], ['침대', 'shop.html?category=bed'], ['조명', 'shop.html?category=lighting'], ['리빙', 'shop.html?category=decor']] },
    { name: 'COLLECTION', href: 'index.html#edition', links: [['Onnono Edition', 'index.html#edition'], ['공간별 제안', 'index.html#spaces'], ['New Collection', 'shop.html']] },
    { name: 'EVENT', href: 'index.html#sale', links: [['Onnono Sale', 'index.html#sale']] },
    { name: 'MAGAZINE', href: 'index.html#reviews', links: [['공간 이야기', 'index.html#reviews'], ['리얼 리뷰', 'product.html?id=p01#product-reviews']] },
    { name: 'ABOUT', href: 'index.html#footer', links: [['브랜드 소개', 'index.html#edition'], ['고객센터', 'index.html#footer']] },
  ];

  function renderHeader() {
    const utilities = [['login', '로그인'], ['signup', '회원가입'], ['search', '검색'], ['cart', '장바구니'], ['account', '마이페이지']];
    $('#site-header').innerHTML = `<div class="header-top">
      <div class="header-left"><button class="mobile-menu-button" type="button" aria-label="전체 메뉴 열기" aria-controls="mobile-menu" aria-expanded="false">☰</button><a class="brand" href="index.html" aria-label="Onnono 홈"><img src="assets/logo.png" alt="Onnono" width="100" height="100"></a></div>
      <nav class="utility-nav" aria-label="사용자 메뉴">${utilities.map(([key, label]) => `<button class="utility-action" type="button" data-open="${key}" aria-label="${label}"><span class="utility-icon">${icon(key === 'account' ? 'user' : key)}</span><span class="utility-label">${label}</span>${key === 'cart' ? '<span class="cart-count" id="cart-count" hidden>0</span>' : ''}</button>`).join('')}</nav>
    </div>
    <nav class="nav-bar" aria-label="주 메뉴"><ul class="main-nav">${navGroups.map((group) => `<li class="nav-item"><a class="nav-link" href="${group.href}"${(page === 'home' && group.name === 'HOME') || (page === 'shop' && group.name === 'NEW') ? ' aria-current="page"' : ''}>${group.name}</a>${group.links ? `<div class="mega-menu"><p class="mega-title">${group.name}</p><div class="mega-links">${group.links.map(([label, href]) => `<a href="${href}">${label}</a>`).join('')}</div></div>` : ''}</li>`).join('')}</ul></nav>`;
  }

  function renderFooter() {
    $('#site-footer').className = 'site-footer';
    $('#site-footer').innerHTML = `<div id="footer" class="footer-top"><div class="footer-information">
      <div class="footer-links"><button type="button" data-info="terms">이용약관</button><button type="button" data-info="privacy">개인정보처리방침</button><button type="button" data-info="email">이메일무단수집거부</button><button type="button" data-info="business">사업자정보확인</button></div>
      <dl class="footer-details"><dt>회사명</dt><dd>(주)Onnono</dd><dt>대표</dt><dd>김예림</dd><dt>사업자등록번호</dt><dd>111-11-1111</dd><dt>통신판매업신고</dt><dd>제2026-포트폴리오-409호</dd><dt>주소</dt><dd>서울특별시 포트폴리오로 52길</dd><dt>대표번호</dt><dd>02-731-1588</dd><dt>이메일</dt><dd>hello@gmail.com</dd><dt>개인정보관리책임자</dt><dd>김예림</dd></dl>
      </div><a class="footer-brand" href="index.html" aria-label="Onnono 홈"><img src="assets/logo.png" alt="Onnono" loading="lazy" width="100" height="100"></a></div>
      <div class="footer-service"><h2>고객센터 1588-2048</h2><div class="service-hours"><p>평일</p><strong>09:30 ~ 18:00</strong><p>점심시간</p><strong>12:30 ~ 13:30</strong><p>토 · 일 · 공휴일 휴무</p></div></div>
      <p class="footer-copyright">© 2026 Onnono Furniture. All Rights Reserved.<br>취업용도의 포트폴리오 홈페이지입니다.</p>
      <button class="back-to-top" type="button" aria-label="맨 위로 가기">TOP</button>`;
  }

  function renderOverlays() {
    $('#overlays').innerHTML = `
      <div class="mobile-menu" id="mobile-menu" hidden role="dialog" aria-modal="true" aria-label="전체 메뉴" tabindex="-1"><div class="mobile-menu-top"><a class="brand" href="index.html"><img src="assets/logo.png" alt="Onnono" width="70" height="70"></a><button class="close-button" type="button" data-close-menu aria-label="전체 메뉴 닫기">×</button></div><nav class="mobile-links" aria-label="모바일 주 메뉴">${navGroups.map((group) => `<a href="${group.href}">${group.name}<span aria-hidden="true">↗</span></a>`).join('')}</nav><div class="mobile-sub-links"><a href="shop.html?category=sofa">소파</a><a href="shop.html?category=chair">체어</a><a href="shop.html?category=table">테이블</a><a href="shop.html?category=storage">수납</a><a href="shop.html?category=bed">침대</a><a href="shop.html?category=lighting">조명</a></div></div>
      <dialog id="search-dialog" aria-labelledby="search-title"><div class="dialog-inner"><div class="dialog-heading"><h2 id="search-title">어떤 공간을 찾으세요?</h2><button class="close-button" type="button" data-close-dialog aria-label="검색 닫기">×</button></div><form class="search-form" action="shop.html" method="get"><label class="sr-only" for="search-input">상품 검색</label><input id="search-input" name="q" type="search" placeholder="상품명 또는 공간을 검색해 보세요" required maxlength="80"><button type="submit">검색 →</button></form><div class="search-hints"><a href="shop.html?q=소파">#소파</a><a href="shop.html?q=테이블">#테이블</a><a href="shop.html?q=조명">#조명</a><a href="shop.html?q=원목">#원목</a></div></div></dialog>
      <dialog id="cart-dialog" class="cart-dialog" aria-labelledby="cart-title"><div class="dialog-inner"><div class="dialog-heading"><h2 id="cart-title">장바구니</h2><button class="close-button" type="button" data-close-dialog aria-label="장바구니 닫기">×</button></div><div id="cart-content"></div></div></dialog>
      <dialog id="info-dialog" aria-labelledby="info-title"><div class="dialog-inner"><div class="dialog-heading"><h2 id="info-title"></h2><button class="close-button" type="button" data-close-dialog aria-label="안내 닫기">×</button></div><div id="info-content" class="info-body"></div></div></dialog>
      <dialog id="lightbox-dialog" class="lightbox-dialog" aria-labelledby="lightbox-title"><div class="dialog-heading"><h2 id="lightbox-title">리뷰 이미지</h2><button class="close-button" type="button" data-close-dialog aria-label="이미지 닫기">×</button></div><img class="lightbox-image" id="lightbox-image" alt=""><div class="lightbox-nav"><button type="button" data-lightbox-prev>← 이전</button><span id="lightbox-counter"></span><button type="button" data-lightbox-next>다음 →</button></div></dialog>
      <div class="toast" id="toast" role="status" aria-live="polite"></div>`;
  }

  function showToast(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2800);
  }

  function showDialog(id) {
    closeMenu(false);
    $$('dialog[open]').forEach((dialog) => dialog.close());
    const dialog = $(`#${id}`);
    dialog.showModal();
    document.body.classList.add('modal-open');
    if (id === 'search-dialog') $('#search-input').focus();
  }

  function showInfo(title, body) {
    $('#info-title').textContent = title;
    $('#info-content').innerHTML = body;
    showDialog('info-dialog');
  }

  function openMenu() {
    const menu = $('#mobile-menu');
    menu.hidden = false;
    document.body.classList.add('modal-open');
    $('.mobile-menu-button').setAttribute('aria-expanded', 'true');
    $('#site-header').inert = true;
    $('#main').inert = true;
    $('#site-footer').inert = true;
    $('[data-close-menu]').focus();
  }

  function closeMenu(restoreFocus = true) {
    const menu = $('#mobile-menu');
    if (!menu || menu.hidden) return;
    menu.hidden = true;
    document.body.classList.remove('modal-open');
    $('.mobile-menu-button').setAttribute('aria-expanded', 'false');
    $('#site-header').inert = false;
    $('#main').inert = false;
    $('#site-footer').inert = false;
    if (restoreFocus) $('.mobile-menu-button').focus();
  }

  function updateCartBadge() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    $('#cart-count').hidden = !count;
    $('#cart-count').textContent = count > 99 ? '99+' : count;
    $('[data-open="cart"]').setAttribute('aria-label', `장바구니 ${count}개`);
  }

  function itemPrice(item) {
    // 상세 목업의 소파 할인가는 주문 요약과 동일하게 계산합니다.
    return item.id === 'p01' ? 1285200 : findProduct(item.id).price;
  }

  function renderCart() {
    const target = $('#cart-content');
    if (!cart.length) {
      target.innerHTML = `<div class="cart-empty"><p>장바구니에 담긴 상품이 없어요.</p><a class="primary-button" href="shop.html">상품 둘러보기</a></div>`;
      return;
    }
    const total = cart.reduce((sum, item) => sum + itemPrice(item) * item.quantity, 0);
    target.innerHTML = cart.map((item, index) => {
      const product = findProduct(item.id);
      return `<div class="cart-item"><img src="${product.image}" alt="${escapeHTML(product.name)}" width="85" height="85"><div class="cart-item-info"><a href="${productURL(item.id)}"><strong>${escapeHTML(product.name)}</strong></a><small>${escapeHTML(item.color || '기본 옵션')}</small><span>${money(itemPrice(item))}원</span><div class="quantity-control"><button type="button" data-cart-step="-1" data-cart-index="${index}" aria-label="${escapeHTML(product.name)} 수량 줄이기"${item.quantity === 1 ? ' disabled' : ''}>−</button><input type="number" min="1" max="99" value="${item.quantity}" data-cart-quantity="${index}" aria-label="${escapeHTML(product.name)} 수량"><button type="button" data-cart-step="1" data-cart-index="${index}" aria-label="${escapeHTML(product.name)} 수량 늘리기"${item.quantity === 99 ? ' disabled' : ''}>+</button></div></div><button type="button" class="cart-item-remove" data-cart-remove="${index}" aria-label="${escapeHTML(product.name)} 삭제">삭제</button></div>`;
    }).join('') + `<div class="cart-footer"><p class="cart-subtotal"><span>상품 합계</span><strong>${money(total)}원</strong></p><p class="dialog-description">배송비는 배송 지역과 상품에 따라 달라집니다.</p><button class="primary-button" type="button" data-checkout>주문 내용 확인하기</button></div>`;
  }

  function persistCart() {
    writeStore('cart', cart);
    updateCartBadge();
    renderCart();
  }

  function selectedQuantity() {
    const quantity = Number($('#product-quantity')?.value || 1);
    return Math.max(1, Math.min(99, Math.trunc(Number.isFinite(quantity) ? quantity : 1)));
  }

  function addCurrentToCart(open = false) {
    if (!currentProduct) return;
    const quantity = selectedQuantity();
    const color = $('#product-color')?.value || '기본 옵션';
    const item = cart.find((entry) => entry.id === currentProduct.id && entry.color === color);
    if (item) item.quantity = Math.min(99, item.quantity + quantity);
    else cart.push({ id: currentProduct.id, quantity, color });
    persistCart();
    if (open) showDialog('cart-dialog');
    else showToast('장바구니에 담았어요. 상단 장바구니에서 확인해 주세요.');
  }

  function showCheckout() {
    if (!cart.length) return;
    const total = cart.reduce((sum, item) => sum + itemPrice(item) * item.quantity, 0);
    showInfo('주문 내용 확인', `<p>선택한 상품과 수량을 확인해 주세요.</p><div class="checkout-summary">${cart.map((item) => `<p>${escapeHTML(findProduct(item.id).name)} · ${escapeHTML(item.color)} · ${item.quantity}개</p>`).join('')}<p><strong>상품 합계 ${money(total)}원</strong></p></div><p>이 홈페이지는 포트폴리오용 쇼핑몰입니다. 실제 주문이나 결제는 진행되지 않으며, 결제 정보도 수집하지 않습니다.</p><p style="margin-top:22px"><button class="primary-button" type="button" data-return-cart>장바구니로 돌아가기</button></p>`);
  }

  function toggleSaved(id) {
    const isSaved = saved.includes(id);
    saved = isSaved ? saved.filter((savedId) => savedId !== id) : [...saved, id];
    writeStore('saved', saved);
    $$('[data-save]').forEach((button) => button.setAttribute('aria-pressed', String(saved.includes(button.dataset.save))));
    showToast(isSaved ? '관심상품에서 삭제했어요.' : '관심상품에 저장했어요. 마이페이지에서 확인할 수 있어요.');
    if (page === 'shop' && params.get('saved') === '1') renderCatalog();
  }

  function renderHome() {
    $('#category-grid').innerHTML = data.categories.map((category) => `<a class="category-card" href="shop.html?category=${category.filter}" aria-label="${category.ko} 상품 보기"><img src="${category.image}" alt="${category.ko} 인테리어" loading="lazy" width="444" height="296"><span>${category.label}</span></a>`).join('');
    $('#story-grid').innerHTML = data.reviews.map((review) => {
      const product = findProduct(review.productId);
      return `<article class="story-card"><a class="story-photo" href="${productURL(review.productId)}#product-reviews" aria-label="${escapeHTML(review.author)}의 공간과 리뷰 보기"><img src="${review.image}" alt="${escapeHTML(review.author)}의 Onnono 공간" loading="lazy" width="1254" height="1254"></a><div class="story-body">${stars()}<h3>${escapeHTML(review.author)}</h3><p class="story-copy" id="story-${review.id}">${escapeHTML(review.text)}</p><button class="story-more" type="button" data-expand-story="${review.id}" aria-expanded="false" aria-controls="story-${review.id}">더보기</button></div><a class="story-product" href="${productURL(product.id)}"><img src="${product.image}" alt="${escapeHTML(product.name)}" loading="lazy" width="100" height="100"><div class="story-product-info"><strong>${escapeHTML(product.name)}</strong><span>${categoryLabel(product.category)}</span><div>${priceMarkup(product)}</div></div></a></article>`;
    }).join('');
    $('#sale-grid').innerHTML = data.saleProducts.map(productCard).join('');
    initCarousel();
  }

  function categoryLabel(category) {
    return { sofa: 'SOFA · 소파', chair: 'CHAIR · 체어', table: 'TABLE · 테이블', storage: 'STORAGE · 수납', bed: 'BED · 침대', lighting: 'LIGHTING · 조명', decor: 'LIVING · 리빙' }[category] || 'ONNONO COLLECTION';
  }

  function initCarousel() {
    const hero = $('.hero');
    const track = $('.hero-track');
    const slides = $$('.hero-slide');
    const dots = $$('.hero-dot');
    const pause = $('.hero-pause');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let index = 0;
    let timer;
    let paused = reducedMotion.matches;
    let hovered = false;
    let focused = false;
    let touchStart = null;

    function moveTo(next, announce = false) {
      index = (next + slides.length) % slides.length;
      track.style.transform = `translateX(-${index * 100}%)`;
      slides.forEach((slide, slideIndex) => {
        slide.inert = slideIndex !== index;
        slide.setAttribute('aria-hidden', String(slideIndex !== index));
      });
      dots.forEach((dot, dotIndex) => {
        if (dotIndex === index) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
        $('img', dot).src = `assets/icon-dot${dotIndex === index ? '-active' : ''}.svg`;
      });
      $('#slide-status').setAttribute('aria-live', announce ? 'polite' : 'off');
      $('#slide-status').textContent = `${index + 1} / ${slides.length}`;
    }

    function schedule() {
      clearInterval(timer);
      if (!paused && !hovered && !focused && !document.hidden) timer = setInterval(() => moveTo(index + 1), 5500);
    }

    function manual(next) { moveTo(next, true); schedule(); }
    function updatePause() {
      pause.textContent = paused ? '▶' : 'Ⅱ';
      pause.setAttribute('aria-pressed', String(paused));
      pause.setAttribute('aria-label', paused ? '자동 슬라이드 재생' : '자동 슬라이드 일시정지');
    }

    $('.hero-prev').addEventListener('click', () => manual(index - 1));
    $('.hero-next').addEventListener('click', () => manual(index + 1));
    dots.forEach((dot) => dot.addEventListener('click', () => manual(Number(dot.dataset.slide))));
    pause.addEventListener('click', () => { paused = !paused; updatePause(); schedule(); });
    hero.addEventListener('mouseenter', () => { hovered = true; schedule(); });
    hero.addEventListener('mouseleave', () => { hovered = false; schedule(); });
    hero.addEventListener('focusin', () => { focused = true; schedule(); });
    hero.addEventListener('focusout', (event) => { if (!hero.contains(event.relatedTarget)) { focused = false; schedule(); } });
    hero.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); manual(index - 1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); manual(index + 1); }
    });
    hero.addEventListener('touchstart', (event) => { touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY }; }, { passive: true });
    hero.addEventListener('touchend', (event) => {
      if (!touchStart) return;
      const dx = event.changedTouches[0].clientX - touchStart.x;
      const dy = event.changedTouches[0].clientY - touchStart.y;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) manual(index + (dx < 0 ? 1 : -1));
      touchStart = null;
    }, { passive: true });
    document.addEventListener('visibilitychange', schedule);
    reducedMotion.addEventListener('change', (event) => { paused = event.matches; updatePause(); schedule(); });
    moveTo(0);
    updatePause();
    schedule();
  }

  let activeFilter = params.get('category') || 'all';
  let searchQuery = (params.get('q') || '').trim();

  function renderCatalog() {
    const favoritesOnly = params.get('saved') === '1';
    let products = favoritesOnly ? allProducts.filter((product) => saved.includes(product.id)) : [...data.products];
    const allowed = ['all', 'sofa', 'chair', 'table', 'storage', 'bed', 'lighting', 'decor', 'living', 'bathroom'];
    if (!allowed.includes(activeFilter)) activeFilter = 'all';
    if (activeFilter === 'living') products = products.filter((product) => ['sofa', 'chair', 'table', 'lighting', 'decor'].includes(product.category));
    else if (activeFilter !== 'all') products = products.filter((product) => product.category === activeFilter);
    if (searchQuery) {
      const query = searchQuery.toLocaleLowerCase();
      products = products.filter((product) => `${product.name} ${product.description} ${categoryLabel(product.category)}`.toLocaleLowerCase().includes(query));
    }
    const order = $('#sort-order').value;
    if (order === 'low') products.sort((a, b) => a.price - b.price);
    if (order === 'high') products.sort((a, b) => b.price - a.price);
    if (order === 'name') products.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    $('#catalog-grid').innerHTML = products.map(productCard).join('');
    $('#result-count').textContent = `${products.length} PRODUCTS`;
    $('#catalog-empty').hidden = products.length > 0;
    $$('.filter-list button').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.filter === activeFilter)));
    const summary = $('#search-summary');
    summary.hidden = !(searchQuery || favoritesOnly || activeFilter === 'bathroom');
    summary.textContent = searchQuery ? `“${searchQuery}” 검색 결과` : favoritesOnly ? '저장한 관심상품을 모아 보세요.' : '욕실 컬렉션은 준비 중입니다.';
    if (favoritesOnly) $('#collection-title').textContent = 'YOUR WISHLIST';
  }

  function initCatalog() {
    renderCatalog();
    $('.filter-list').addEventListener('click', (event) => {
      const button = event.target.closest('[data-filter]');
      if (!button) return;
      activeFilter = button.dataset.filter;
      updateCatalogURL();
      renderCatalog();
    });
    $('#sort-order').addEventListener('change', renderCatalog);
  }

  function updateCatalogURL() {
    const url = new URL(location.href);
    if (activeFilter === 'all') url.searchParams.delete('category');
    else url.searchParams.set('category', activeFilter);
    if (searchQuery) url.searchParams.set('q', searchQuery);
    else url.searchParams.delete('q');
    try { history.replaceState(null, '', url); } catch (_) { /* file://에서도 필터 동작은 유지 */ }
  }

  function productReviews(product) {
    if (product.id !== 'p01') {
      const story = data.reviews.find((review) => review.productId === product.id);
      if (story) {
        return `<div class="review-summary"><div><strong>5.0</strong> <span> / 5 · 포토리뷰 1</span></div>${stars()}</div><article class="review-row"><div class="review-user"><strong>${escapeHTML(story.author)}</strong><time>${escapeHTML(story.date)}</time></div><div class="review-content">${stars()}<p class="review-text" id="detail-review-${story.id}">${escapeHTML(story.text)}</p><button class="review-expand" type="button" data-review-expand="${story.id}" aria-expanded="false" aria-controls="detail-review-${story.id}">더보기 ${icon('review-chevron')}</button><div class="review-photos"><button type="button" data-story-photo="${story.id}" aria-label="공간 리뷰 사진 크게 보기"><img src="${story.image}" alt="${escapeHTML(story.author)}의 Onnono 공간" loading="lazy" width="200" height="200"></button></div></div></article>`;
      }
      return `<div class="empty-state"><h3>이 상품의 첫 번째 이야기를 기다리고 있어요.</h3><p>다른 공간의 리뷰도 만나보세요.</p><a class="outline-link" href="index.html#reviews">공간 리뷰 보기 ↗</a></div>`;
    }
    const helpful = readStore('helpful', []);
    return `<div class="review-summary"><div><strong>5.0</strong> <span> / 5 · 포토리뷰 5</span></div>${stars()}<label><span class="sr-only">리뷰 정렬</span><select id="review-sort" class="review-filter"><option value="new">최신순</option><option value="helpful">도움순</option></select></label></div>
      <div id="review-list">${Array.from({ length: 5 }, (_, index) => `<article class="review-row" data-review-index="${index}"><div class="review-user"><strong>김*림</strong><time datetime="2026-09-16">2026.09.16</time></div><div class="review-content">${stars()}<p class="review-text" id="detail-review-${index}">${escapeHTML(data.detailReviewText)}</p><button class="review-expand" type="button" data-review-expand="${index}" aria-expanded="false" aria-controls="detail-review-${index}">더보기 ${icon('review-chevron')}</button><div class="review-photos">${data.reviewImages.map((image, imageIndex) => `<button type="button" data-review-photo="${imageIndex}" aria-label="리뷰 사진 ${imageIndex + 1} 크게 보기"><img src="${image}" alt="구매자가 공유한 가구와 인테리어 사진 ${imageIndex + 1}" loading="lazy" width="200" height="200"></button>`).join('')}</div><div class="review-reactions"><button type="button" data-helpful="${index}" aria-pressed="${Array.isArray(helpful) && helpful.includes(index)}">도움이 돼요 <span>${Array.isArray(helpful) && helpful.includes(index) ? '1' : '0'}</span></button><button type="button" data-info="review-report">신고</button></div></div></article>`).join('')}</div>`;
  }

  function renderProduct() {
    const id = params.get('id') || 'p01';
    currentProduct = findProduct(id) || data.products[0];
    const product = currentProduct;
    const reviewCount = product.id === 'p01' ? 5 : data.reviews.filter((review) => review.productId === product.id).length;
    document.title = `${product.name} — ONNONO`;
    $('#breadcrumb-name').textContent = product.name;
    const gallery = product.id === 'p01' ? data.products.slice(0, 6).map((item) => item.image) : [product.image];
    // 소파 상세 목업의 작은 썸네일 6개도 원본 레이어 순서대로 연결합니다.
    const name = product.id === 'p01' ? '아르코 부클레 소파' : product.name;
    const description = product.id === 'p01' ? '부드러운 곡선과 포근한 패브릭으로 완성한 여유로운 휴식' : product.description;
    $('#product-view').innerHTML = `<section class="product-top page-width" aria-labelledby="product-title"><div class="product-gallery"><button type="button" class="gallery-main" aria-label="상품 이미지 크게 보기" data-gallery-enlarge><img id="gallery-main-image" src="${product.image}" alt="${escapeHTML(product.name)}" width="751" height="751" fetchpriority="high"></button><div class="gallery-thumbs" aria-label="상품 이미지 선택">${gallery.map((image, index) => `<button type="button" class="gallery-thumb" data-gallery-index="${index}" data-gallery-image="${image}" aria-label="상품 이미지 ${index + 1}" aria-pressed="${index === 0}"><img src="${image}" alt="${escapeHTML(product.id === 'p01' ? data.products[index].name : product.name)}" loading="lazy" width="164" height="164"></button>`).join('')}</div></div>
      <div class="product-summary"><span class="new-badge">${product.originalPrice ? 'SALE' : 'NEW'}</span><h1 id="product-title">${escapeHTML(name)}</h1><p class="subtitle">${escapeHTML(description)}</p><div class="detail-price">${priceMarkup(product, true)}</div>
      <dl class="benefits-table"><div class="benefit-row"><dt>회원혜택</dt><dd><strong>Onnono 신규 회원 혜택</strong><small>회원 할인과 적립은 실제 쇼핑몰 연동 후 적용됩니다.</small></dd></div><div class="benefit-row"><dt>상품정보</dt><dd>${escapeHTML(categoryLabel(product.category))}<small>자연을 닮은 소재와 부드러운 디자인</small></dd></div><div class="benefit-row"><dt>배송안내</dt><dd>전문 배송 기사가 직접 배송합니다.<small>배송 지역과 상품별로 배송비가 다를 수 있습니다.</small></dd></div></dl>
      <div class="product-options"><label for="product-color">컬러</label><select id="product-color"><option value="기본 컬러 (이미지 참조)">기본 컬러 (이미지 참조)</option></select><label for="product-quantity">수량</label><div class="quantity-control"><button type="button" data-product-step="-1" aria-label="수량 줄이기" disabled>−</button><input id="product-quantity" type="number" min="1" max="99" value="1" inputmode="numeric"><button type="button" data-product-step="1" aria-label="수량 늘리기">+</button></div></div>
      <p class="order-total"><span>총 합계금액</span><strong><span id="product-total">${money(itemPrice({ id: product.id }))}</span><small> 원</small></strong></p><p class="purchase-note">※ 회원 혜택가는 실제 주문서 작성 시 적용됩니다.</p><div class="purchase-actions"><button class="secondary-button" type="button" data-add-cart>장바구니</button><button class="primary-button" type="button" data-buy>구매하기</button></div></div></section>
      <nav class="product-tabs" aria-label="상품 상세 메뉴"><a href="#product-details">상품정보</a><a href="#product-reviews">상품리뷰 (${reviewCount})</a><a href="#product-qna">상품 Q&amp;A</a></nav>
      <section class="detail-section" id="product-details" aria-label="상품 상세정보">${product.id === 'p01' ? '<img class="detail-original" src="assets/product-detail.png" alt="아르코 부클레 소파 상세정보. 부드러운 곡선, 포근한 패브릭과 안정적인 구조를 소개하는 피그마 원본 상세 이미지" loading="lazy" width="671" height="2341">' : `<div class="simple-detail"><p class="eyebrow">ONNONO FURNITURE</p><h2>${escapeHTML(product.name)}</h2><p>${escapeHTML(product.description)}</p><img src="${product.image}" alt="${escapeHTML(product.name)} 공간 이미지" loading="lazy" width="1254" height="1254"></div>`}</section>
      <section class="product-reviews" id="product-reviews" aria-labelledby="product-reviews-title"><h2 id="product-reviews-title" class="detail-section-heading">상품 리뷰</h2>${productReviews(product)}</section>
      <section class="qna-section" id="product-qna" aria-labelledby="qna-title"><h2 id="qna-title" class="detail-section-heading">상품 Q&amp;A</h2><div class="qna-list"><details><summary>배송 일정은 어떻게 확인하나요?</summary><p>가구는 상품과 배송 지역에 따라 일정이 달라집니다. 실제 판매 시에는 주문 이후 안내되는 배송 일정을 확인해 주세요.</p></details><details><summary>색상과 소재를 확인하고 싶어요.</summary><p>상품 이미지를 참고해 주세요. 화면 설정과 조명에 따라 색상이 다르게 보일 수 있습니다. 실제 구매 전에는 판매처의 소재와 규격 안내를 확인해 주세요.</p></details><details><summary>이 홈페이지에서 실제 구매가 가능한가요?</summary><p>이 홈페이지는 디자인 포트폴리오입니다. 상품 탐색, 옵션과 수량 선택, 장바구니, 리뷰 보기를 체험할 수 있으며 실제 주문과 결제는 처리되지 않습니다.</p></details></div></section>`;
    $('#product-quantity').addEventListener('change', updateProductTotal);
    const sort = $('#review-sort');
    if (sort) sort.addEventListener('change', sortReviews);
    if (location.hash) requestAnimationFrame(() => $(location.hash)?.scrollIntoView());
  }

  function updateProductTotal() {
    const quantity = selectedQuantity();
    $('#product-quantity').value = quantity;
    $('#product-total').textContent = money(itemPrice({ id: currentProduct.id }) * quantity);
    $('[data-product-step="-1"]').disabled = quantity <= 1;
    $('[data-product-step="1"]').disabled = quantity >= 99;
  }

  function sortReviews() {
    const list = $('#review-list');
    const helpful = readStore('helpful', []);
    const marked = Array.isArray(helpful) ? helpful : [];
    const items = $$('.review-row', list).sort((a, b) => {
      const left = Number(a.dataset.reviewIndex), right = Number(b.dataset.reviewIndex);
      if ($('#review-sort').value === 'helpful') return Number(marked.includes(right)) - Number(marked.includes(left)) || left - right;
      return left - right;
    });
    items.forEach((item) => list.appendChild(item));
  }

  function openLightbox(items, index, title) {
    lightboxItems = items;
    lightboxIndex = index;
    $('#lightbox-title').textContent = title;
    updateLightbox();
    showDialog('lightbox-dialog');
  }

  function updateLightbox() {
    $('#lightbox-image').src = lightboxItems[lightboxIndex];
    $('#lightbox-image').alt = `${$('#lightbox-title').textContent} ${lightboxIndex + 1}`;
    $('#lightbox-counter').textContent = `${lightboxIndex + 1} / ${lightboxItems.length}`;
    $('[data-lightbox-prev]').hidden = lightboxItems.length < 2;
    $('[data-lightbox-next]').hidden = lightboxItems.length < 2;
  }

  function moveLightbox(step) {
    if (!lightboxItems.length) return;
    lightboxIndex = (lightboxIndex + step + lightboxItems.length) % lightboxItems.length;
    updateLightbox();
  }

  const infoPages = {
    terms: ['이용약관 안내', '<p>Onnono는 가구 쇼핑몰 UI를 소개하는 취업용 포트폴리오입니다. 실제 상품 판매, 회원 계약 또는 결제가 이루어지지 않습니다.</p>'],
    privacy: ['개인정보처리방침 안내', '<p>이 포트폴리오는 회원가입 정보나 결제 정보를 수집하지 않습니다.</p><h3>브라우저에 저장되는 항목</h3><p>관심상품, 장바구니, 리뷰의 도움이 돼요 선택은 현재 브라우저의 저장소에만 보관됩니다. 브라우저의 사이트 데이터 삭제 기능으로 지울 수 있습니다.</p>'],
    email: ['이메일무단수집거부', '<p>본 홈페이지에 게시된 이메일 주소의 무단 수집을 거부합니다.</p>'],
    business: ['사업자정보 안내', '<p>푸터의 회사명, 사업자등록번호, 주소와 고객센터 번호는 피그마 디자인의 예시 정보입니다. 실제 사업자 정보 조회나 상담으로 연결되지 않습니다.</p>'],
    'review-report': ['리뷰 신고 안내', '<p>디자인 목업의 리뷰를 재현한 포트폴리오 화면입니다. 리뷰 신고는 실제 서비스가 연결된 이후 이용할 수 있습니다.</p>'],
  };

  function bindEvents() {
    document.addEventListener('click', (event) => {
      const target = event.target;
      const close = target.closest('[data-close-dialog]');
      if (close) { close.closest('dialog').close(); return; }
      if (target.closest('.back-to-top')) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      if (target.closest('.mobile-menu-button')) { openMenu(); return; }
      if (target.closest('[data-close-menu]')) { closeMenu(); return; }
      if (target.closest('.mobile-menu a')) closeMenu(false);

      const opener = target.closest('[data-open]');
      if (opener) {
        const action = opener.dataset.open;
        if (action === 'search') showDialog('search-dialog');
        if (action === 'cart') { renderCart(); showDialog('cart-dialog'); }
        if (action === 'login' || action === 'signup') showInfo(action === 'login' ? '로그인' : '회원가입', '<p>Onnono의 공간을 둘러보세요.</p><p>현재는 포트폴리오 화면으로, 실제 회원가입과 로그인은 연결되어 있지 않습니다. 관심상품과 장바구니는 로그인 없이 현재 브라우저에 저장할 수 있어요.</p><p style="margin-top:22px"><a class="primary-button" href="shop.html">컬렉션 둘러보기</a></p>');
        if (action === 'account') showInfo('마이페이지', `<p>나의 취향이 담긴 공간.</p><p>관심상품 ${saved.length}개를 저장했어요.</p><p style="margin-top:22px"><a class="primary-button" href="shop.html?saved=1">관심상품 보기</a></p>`);
        if (action === 'news') showInfo('ONNONO NEWS', '<p>Onnono의 새로운 이야기와 공지사항을 만나보세요.</p><h3>새로운 계절, 새로운 컬렉션</h3><p>자연을 닮은 소재와 부드러운 곡선으로 완성한 Onnono의 신상품을 소개합니다.</p><p style="margin-top:22px"><a class="primary-button" href="shop.html">신상품 보러 가기 →</a></p>');
        return;
      }

      const info = target.closest('[data-info]');
      if (info) { const content = infoPages[info.dataset.info]; if (content) showInfo(...content); return; }
      const save = target.closest('[data-save]');
      if (save) { toggleSaved(save.dataset.save); return; }
      const story = target.closest('[data-expand-story]');
      if (story) {
        const expanded = story.getAttribute('aria-expanded') !== 'true';
        story.setAttribute('aria-expanded', String(expanded));
        story.textContent = expanded ? '접기' : '더보기';
        $(`#story-${story.dataset.expandStory}`).classList.toggle('is-expanded', expanded);
        return;
      }
      const resetFilter = target.closest('[data-reset-filter]');
      if (resetFilter) { activeFilter = 'all'; searchQuery = ''; params.delete('saved'); const url = new URL(location.href); url.searchParams.delete('saved'); try { history.replaceState(null, '', url); } catch (_) {} $('#collection-title').textContent = 'NEW COLLECTION'; updateCatalogURL(); renderCatalog(); return; }
      const stepper = target.closest('[data-product-step]');
      if (stepper) { $('#product-quantity').value = selectedQuantity() + Number(stepper.dataset.productStep); updateProductTotal(); return; }
      if (target.closest('[data-add-cart]')) { addCurrentToCart(); return; }
      if (target.closest('[data-buy]')) { addCurrentToCart(true); return; }
      const gallery = target.closest('[data-gallery-image]');
      if (gallery) {
        $('#gallery-main-image').src = gallery.dataset.galleryImage;
        $('#gallery-main-image').alt = $('img', gallery).alt;
        $$('.gallery-thumb').forEach((button) => button.setAttribute('aria-pressed', String(button === gallery)));
        return;
      }
      if (target.closest('[data-gallery-enlarge]')) {
        const items = $$('.gallery-thumb').map((button) => button.dataset.galleryImage);
        const index = Math.max(0, items.indexOf($('#gallery-main-image').getAttribute('src')));
        openLightbox(items, index, '상품 이미지');
        return;
      }
      const reviewExpand = target.closest('[data-review-expand]');
      if (reviewExpand) {
        const expanded = reviewExpand.getAttribute('aria-expanded') !== 'true';
        reviewExpand.setAttribute('aria-expanded', String(expanded));
        reviewExpand.innerHTML = `${expanded ? '접기' : '더보기'} ${icon('review-chevron')}`;
        $(`#detail-review-${reviewExpand.dataset.reviewExpand}`).classList.toggle('is-expanded', expanded);
        return;
      }
      const reviewPhoto = target.closest('[data-review-photo]');
      if (reviewPhoto) { openLightbox(data.reviewImages, Number(reviewPhoto.dataset.reviewPhoto), '리뷰 이미지'); return; }
      const storyPhoto = target.closest('[data-story-photo]');
      if (storyPhoto) { const story = data.reviews.find((review) => review.id === storyPhoto.dataset.storyPhoto); if (story) openLightbox([story.image], 0, '공간 리뷰 이미지'); return; }
      if (target.closest('[data-lightbox-prev]')) { moveLightbox(-1); return; }
      if (target.closest('[data-lightbox-next]')) { moveLightbox(1); return; }
      const helpful = target.closest('[data-helpful]');
      if (helpful) {
        const index = Number(helpful.dataset.helpful);
        const stored = readStore('helpful', []);
        const marked = Array.isArray(stored) ? stored : [];
        const isMarked = marked.includes(index);
        writeStore('helpful', isMarked ? marked.filter((item) => item !== index) : [...marked, index]);
        helpful.setAttribute('aria-pressed', String(!isMarked));
        $('span', helpful).textContent = isMarked ? '0' : '1';
        if ($('#review-sort')?.value === 'helpful') sortReviews();
        return;
      }
      const remove = target.closest('[data-cart-remove]');
      if (remove) { cart.splice(Number(remove.dataset.cartRemove), 1); persistCart(); return; }
      const cartStep = target.closest('[data-cart-step]');
      if (cartStep) {
        const item = cart[Number(cartStep.dataset.cartIndex)];
        item.quantity = Math.max(1, Math.min(99, item.quantity + Number(cartStep.dataset.cartStep)));
        persistCart();
        return;
      }
      if (target.closest('[data-checkout]')) { showCheckout(); return; }
      if (target.closest('[data-return-cart]')) { renderCart(); showDialog('cart-dialog'); }
    });

    document.addEventListener('change', (event) => {
      const input = event.target.closest('[data-cart-quantity]');
      if (!input) return;
      const value = Number(input.value);
      cart[Number(input.dataset.cartQuantity)].quantity = Math.max(1, Math.min(99, Math.trunc(Number.isFinite(value) ? value : 1)));
      persistCart();
    });

    $$('dialog').forEach((dialog) => {
      dialog.addEventListener('close', () => { if (!document.querySelector('dialog[open]')) document.body.classList.remove('modal-open'); });
      dialog.addEventListener('click', (event) => {
        if (event.target !== dialog) return;
        const bounds = dialog.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
      });
    });

    document.addEventListener('keydown', (event) => {
      const menu = $('#mobile-menu');
      if (!menu.hidden) {
        if (event.key === 'Escape') { event.preventDefault(); closeMenu(); }
        if (event.key === 'Tab') {
          const focusable = $$('a,button', menu), first = focusable[0], last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
      }
      if ($('#lightbox-dialog').open) {
        if (event.key === 'ArrowLeft') { event.preventDefault(); moveLightbox(-1); }
        if (event.key === 'ArrowRight') { event.preventDefault(); moveLightbox(1); }
      }
    });

    window.addEventListener('storage', (event) => {
      if (event.key === 'onnono-cart') {
        const next = readStore('cart', []);
        if (Array.isArray(next)) { cart = next.filter((item) => item && findProduct(item.id) && Number.isInteger(item.quantity) && item.quantity > 0); updateCartBadge(); if ($('#cart-dialog').open) renderCart(); }
      }
      if (event.key === 'onnono-saved') {
        const next = readStore('saved', []);
        if (Array.isArray(next)) { saved = next.filter((id) => findProduct(id)); $$('[data-save]').forEach((button) => button.setAttribute('aria-pressed', String(saved.includes(button.dataset.save)))); if (page === 'shop' && params.get('saved') === '1') renderCatalog(); }
      }
    });
  }

  renderHeader();
  renderFooter();
  renderOverlays();
  updateCartBadge();
  bindEvents();
  if (page === 'home') renderHome();
  if (page === 'shop') initCatalog();
  if (page === 'product') renderProduct();
})();
