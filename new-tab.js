var lang;
var bookmarks;

var clockInterval;
var displaySeconds;
var chosenBgOption;
var selectedSearchEng;
var clockElement = document.getElementById('time');
var dateElement = document.getElementById('date');
var bookmarksWrapperElement = document.getElementById('bookmarks-wrapper');
var weatherElement = document.getElementById('weather-wrapper');
var searchElement = document.getElementById('search-wrapper');
var toggleWeatherElement = document.getElementById('show-weather');
var toggleClockElement = document.getElementById('show-clock');
var toggleSecondsElement = document.getElementById('show-seconds');
var toggleDateElement = document.getElementById('show-date');
var toggleBookmarksElement = document.getElementById('show-bookmarks');
var toggleSearchElement = document.getElementById('show-search');
var searchFormElement = document.getElementById('search-form');
var addingBookmarkFormElement = document.getElementById('form-adding-bookmark');
var cityForm = document.getElementById('weather-form');
var cityInputElement = document.getElementById('city');
var cityButtonElement = document.getElementById('city-button')
var searchOptions = document.getElementById('search-options');
var langOptions = document.getElementById('lang-options');
var color1 = document.getElementById('color1');
var color2 = document.getElementById('color2');
var pageBg = document.getElementById('page-background');
var bookmarkAddButton = document.getElementById('bookmark-add-button');
var toggleHomepageInfo = document.getElementById('toggle-homepage-info');
var bookmarkItemTemp = document.getElementById('bookmark-item');
var bookmarkItems = document.getElementById('bookmarks-items');
var bookmarksList = document.getElementById('bookmark-list');
var bookmarksListItemTemp = document.getElementById('bookmark-list-item');
var noBookmarkTemp = document.getElementById('no-bookmark');
var weatherTemp = document.getElementById('weather-temp');
var weatherInfo = document.getElementById('weather-info');
var dateTemp = document.getElementById('date-temp');

callInitFunctions();

function callInitFunctions() {
    browser.scrip
    getLanguage();
    createListeners();
    getBookmarks();
    checkDateVisibility();
    readInitWeatherState();
    readPropertyBooleanOnInit('showClock', clockElement, toggleClockElement, onShowClockCb, onHideClockCb);
    readPropertyBooleanOnInit('showDate', dateElement, toggleDateElement);
    readPropertyBooleanOnInit('showBookmarks', bookmarksWrapperElement, toggleBookmarksElement);
    readPropertyBooleanOnInit('showSearch', searchElement, toggleSearchElement, () => searchOptions.disabled = false, () => searchOptions.disabled = true);
    initClock();
    readInitBackgroundState();
    readInitSearchState();
    displayHomepageUrl();
    searchFormElement.reset();
}

function setProperty(property, value) {
    browser.storage.local.set({
        [property]: value
    })
}

function getProperty(property) {
    return browser.storage.local.get(property).then((loaded) => {
            return loaded;
        },
        (err) => console.log('Error with loading data: ', err));
}

async function getData(url = '') {
    const response = await fetch(url);
    return response.json();
}

function createListeners() {
    toggleClockElement.addEventListener('change', (e) => {
        toggleElementVisibility(clockElement, e.target.checked, 'showClock');
        disableSecondsCheckbox(!e.target.checked);
        toggleDateBorder(e.target.checked);
    })

    toggleSecondsElement.addEventListener('change', (e) => {
        displaySeconds = e.target.checked;
        setProperty('showSeconds', e.target.checked);
    })

    toggleDateElement.addEventListener('change', (e) => {
        toggleElementVisibility(dateElement, e.target.checked, 'showDate');
    })

    toggleBookmarksElement.addEventListener('change', (e) => {
        toggleElementVisibility(bookmarksWrapperElement, e.target.checked, 'showBookmarks');
    })

    toggleSearchElement.addEventListener('change', (e) => {
        toggleElementVisibility(searchElement, e.target.checked, 'showSearch');
        searchOptions.disabled = !e.target.checked;
    })

    document.getElementById('radio-group').addEventListener('change', e => {
        onBgSettingsChange(e.target.value);
        chosenBgOption = e.target.value;
    })

    bookmarkAddButton.addEventListener('click', showAddBookmarkForm)

    searchOptions.addEventListener('change', e => {
        searchEngChange(e.target.value)
    })

    searchFormElement.addEventListener('submit', submitSearch);

    color1.addEventListener('change', (e) => {
        if (chosenBgOption === 'single-color') {
            setSingleColorBg();
        } else {
            setGradientBg();
        }
    })

    color2.addEventListener('change', (e) => {
        setGradientBg();
    })

    addingBookmarkFormElement.addEventListener('submit', addBookmark);

    langOptions.addEventListener('change', setLanguage);

    cityForm.addEventListener('submit', submitCity);

    toggleWeatherElement.addEventListener('change', (e) => {
        toggleCityForm(!e.target.checked);
        setProperty('showWeather', e.target.checked);
        if (!e.target.checked) {
            weatherElement.style.display = 'none';
        } else {
            getSavedWeatherData();
        }
    })

    document.getElementById('close-settings').addEventListener('click', (e) => {
        document.getElementById('settings-wrapper').style.display = 'none'
        document.getElementById('settings-full-screen').style.display = 'none'
    })

    document.getElementById('settings-button').addEventListener('click', (e) => {
        document.getElementById('settings-wrapper').style.display = 'block';
        document.getElementById('settings-full-screen').style.display = 'block';
    })

    document.getElementById('weather-background').addEventListener('click', (e) => {
        const extraInfo = document.getElementById('extra-info');
        if (extraInfo.style.display === 'none' || extraInfo.style.display === '') {
            extraInfo.style.display = 'block';
        } else {
            extraInfo.style.display = 'none';
        }
    })

    toggleHomepageInfo.addEventListener('click', (e) => {
        const attribute = toggleHomepageInfo.getAttribute('fn');
        if (attribute === 'open') {
            toggleHomepageInfo.setAttribute('fn', 'close');
            document.getElementById('settings-homepage').style.display = 'block';
            toggleHomepageInfo.innerText = translations[lang]['hide-homepage-info'];
        } else {
            toggleHomepageInfo.setAttribute('fn', 'open');
            document.getElementById('settings-homepage').style.display = 'none';
            toggleHomepageInfo.innerText = translations[lang]['show-homepage-info'];
        }
    })
}

function readPropertyBooleanOnInit(propName, elementRef, toggleElementRef, showingCb, hidingCb) {
    getProperty(propName).then(res => {
        if (res[propName]) {
            elementRef.style.display = 'block';
            if (toggleElementRef) {
                toggleElementRef.checked = true;
            }
            if (showingCb) {
                showingCb();
            }
        } else if (res[propName] === false) {
            elementRef.style.display = 'none';
            if (toggleElementRef) {
                toggleElementRef.checked = false;
            }
            if (hidingCb) {
                hidingCb()
            }
        } else {
            // for first initial load
            setProperty(propName, true)
            readPropertyBooleanOnInit(propName, elementRef, toggleElementRef);
        }
    })
}

function toggleElementVisibility(element, show, propertyName) {
    if (show) {
        element.style.display = 'block';
        setProperty(propertyName, true);
    } else {
        element.style.display = 'none';
        setProperty(propertyName, false);
    }
}

function displayHomepageUrl() {
    const url = browser.runtime.getURL('new-tab.html');
    document.getElementById('url-info').innerText = url;
}

/* 
    --- CLOCK ---
*/
// #region
function readInitShowSecondsState() {
    getProperty('showSeconds').then(res => {
        if (res.showSeconds) {
            displaySeconds = true;
            toggleSecondsElement.checked = true;
        } else if (res.showSeconds === false) {
            displaySeconds = false;
            toggleSecondsElement.checked = false;
        } else {
            setProperty('showSeconds', true);
            readInitShowSecondsState();
        }
    })
}

function readInitShowClock() {
    getProperty('showClock').then(res => {
        if (res.showClock) {
            document.getElementById('time').style.display = 'block';
            readInitShowSecondsState();
            disableSecondsCheckbox(false);
            toggleDateBorder(true)
        } else if (res.showClock === false) {
            document.getElementById('time').style.display = 'none';
            disableSecondsCheckbox(true);
            toggleDateBorder(false);
        } else {
            setProperty('showClock', true);
        }
    })
}

function initClock() {
    if (!clockInterval) {
        generateClockTime();
        setClockInterval();
    }
}

function generateClockTime() {
    const date = new Date();
    let hh = date.getHours();
    let mm = date.getMinutes();
    let ss = date.getSeconds();
    hh = (hh < 10) ? '0' + hh : hh;
    mm = (mm < 10) ? '0' + mm : mm;
    ss = (ss < 10) ? '0' + ss : ss;
    if (hh === 0 && mm === 0 && ss < 5) {
        generateClockDate();
    }
    let time;
    if (displaySeconds) {
        time = `${hh}:${mm}:${ss}`
    } else {
        time = `${hh}:${mm}`;
    }
    document.getElementById('time').innerText = time;
}

function setClockInterval() {
    clockInterval = setInterval(generateClockTime, 100);
}

function disableSecondsCheckbox(disable) {
    toggleSecondsElement.disabled = disable;
}

function cancelClockInterval() {
    clearInterval(clockInterval);
}

function toggleDateBorder(show) {
    if (show) {
        dateElement.style.borderTop = '1px white solid'
    } else {
        dateElement.style.borderTop = 'none';
    }
}

function onShowClockCb() {
    readInitShowSecondsState();
    disableSecondsCheckbox(false);
    toggleDateBorder(true);
}

function onHideClockCb() {
    disableSecondsCheckbox(true);
    toggleDateBorder(false);
}

// #endregion 

/*
    --- DATE ---
*/
// #region

function checkDateVisibility() {
    if (true) {
        generateClockDate();
    }
}

function generateClockDate() {
    const currentDate = new Date();
    const day = currentDate.getDay();
    const date = currentDate.getDate();
    const month = currentDate.getMonth();
    dateElement.replaceChildren();
    const dateTempClone = dateTemp.content.cloneNode(true);
    dateTempClone.querySelector('#day').setAttribute('i18n-key', `day${day}`);
    dateTempClone.querySelector('#date').innerText = `${date}.`;
    dateTempClone.querySelector('#month').setAttribute('i18n-key', `month${month}`);

    dateElement.append(dateTempClone);
}
// #endregion

/*
    --- LANGUAGE ---
*/
// #region

function setLanguage(e) {
    let newValue = e.target.value;
    lang = newValue;
    setProperty('lang', newValue);
    if (toggleWeatherElement.checked) {
        getSavedWeatherData();
    }
    translatePage();
}

function getLanguage() {
    getProperty('lang').then(res => {
        lang = res.lang ? res.lang : 'en';
        translatePage();
        langOptions.value = lang;
    })
}

function translatePage() {
    document.querySelectorAll('[i18n-placeholder]')
        .forEach(translatePlaceholders);
    document.querySelectorAll('[i18n-key]')
        .forEach(translateElement);
    document.querySelectorAll('[i18n-title]')
        .forEach(translateTitles);

}

function translateElement(element) {
    const key = element.getAttribute('i18n-key');
    const translation = translations[lang][key];
    element.innerText = translation;
}

function translatePlaceholders(element) {
    const key = element.getAttribute('i18n-placeholder');
    const translation = translations[lang][key];
    element.placeholder = translation;
}

function translateTitles(element) {
    const key = element.getAttribute('i18n-title');
    const translation = translations[lang][key];
    element.title = translation;
}
// #endregion

/*
    --- BACKGROUND ---
*/
// #region

function readInitBackgroundState() {
    getProperty('bgOption').then(res => {
        chosenBgOption = res.bgOption;
        switch (res.bgOption) {
            case 'single-color':
                document.getElementById('single-color').checked = true;
                readSingleColorInitState();
                break;
            case 'gradient':
                document.getElementById('gradient').checked = true;
                readGradientColorInitState();
                break;
            case 'picsum':
                document.getElementById('picsum').checked = true;
                readBgImageInitState();
                break;
            default:
                setProperty('bgOption', 'gradient');
                readInitBackgroundState();
        }
    })
}

function readSingleColorInitState() {
    color1.style.display = 'inline-block';
    getProperty('singleColor').then(res => {
        if (res.singleColor) {
            color1.value = res.singleColor;
        }
        setSingleColorBg();
    })
}

function readGradientColorInitState() {
    color1.style.display = 'inline-block';
    color2.style.display = 'inline-block';
    getProperty('gradientColors').then(res => {
        if (res.gradientColors) {
            color1.value = res.gradientColors.color1;
            color2.value = res.gradientColors.color2;
        }
        setGradientBg();
    })
}

function readBgImageInitState() {
    getProperty('bgImage').then(res => {
        if (res.bgImage) {
            pageBg.style.backgroundImage = `url(${res.bgImage})`;
            fetch('https://picsum.photos/1900/1080').then(res => {
                setProperty('bgImage', res.url);
            })
        }
    })
}

function setSingleColorBg() {
    pageBg.style.backgroundColor = color1.value;
    pageBg.style.backgroundImage = null;
    setProperty('singleColor', color1.value);
    setProperty('bgOption', 'single-color');
}

function setGradientBg() {
    pageBg.style.backgroundImage = `linear-gradient(${color1.value}, ${color2.value})`;
    let gradientColors = {
        color1: color1.value,
        color2: color2.value
    };
    setProperty('gradientColors', gradientColors);
    setProperty('bgOption', 'gradient');
}

function setImageBg() {
    fetch('https://picsum.photos/1900/1080').then(res => {
        pageBg.style.backgroundImage = `url(${res.url})`;
        fetch('https://picsum.photos/1900/1080').then(res => {
            setProperty('bgImage', res.url);
            setProperty('bgOption', 'picsum')
        })
    })
}

function onBgSettingsChange(selected) {
    switch (selected) {
        case 'single-color':
            // display one color picker
            color1.style.display = 'inline-block';
            color2.style.display = 'none';
            setSingleColorBg();
            break;
        case 'gradient':
            // display two color pickers
            color1.style.display = 'inline-block';
            color2.style.display = 'inline-block';
            setGradientBg();
            break;
        case 'picsum':
            // call api and put image to bg and another to memory
            color1.style.display = 'none';
            color2.style.display = 'none';
            setImageBg();
            break;
    }
}

// #endregion

/*
    --- BOOKMARKS ---
*/
// #region

function getBookmarks() {
    getProperty('bookmarks').then(res => {
        if (res.bookmarks && res.bookmarks.length > 0) {
            createBookmarksElements(res.bookmarks)
        } else {
            createNoBookmarksElement();
        }
    })
}

function createBookmarksElements(bookmarks) {
    bookmarksList.style.display = 'block';
    bookmarkItems.replaceChildren();
    bookmarksList.replaceChildren();
    let bmButtons = [];
    if (bookmarks && bookmarks.length > 0) {
        bookmarks.forEach((element, index) => {
            const bookmarkTempClone = bookmarkItemTemp.content.cloneNode(true);
            bookmarkTempClone.querySelector('#bookmark-icon').setAttribute('src', `http://www.google.com/s2/favicons?domain=${element.url}`);
            bookmarkTempClone.querySelector('#bookmark-link').setAttribute('href', element.url);
            bookmarkTempClone.querySelector('#bookmark-title').innerText = element.title;
            bookmarkItems.append(bookmarkTempClone);

            const bookmarksListItemTempClone = bookmarksListItemTemp.content.cloneNode(true);
            bookmarksListItemTempClone.querySelector('.bookmark-list-icon').setAttribute('src', `http://www.google.com/s2/favicons?domain=${element.url}`);
            bookmarksListItemTempClone.querySelector('.bookmark-list-title').innerText = element.title;
            bookmarksListItemTempClone.querySelector('.remove-bm-button').setAttribute('id', `remove${index}`);
            bookmarksListItemTempClone.querySelector('.remove-bm-button').setAttribute('bmIndex', index);
            bookmarksListItemTempClone.querySelector('.remove-bm-icon').setAttribute('bmIndex', index);
            bookmarksListItemTempClone.querySelector('.edit-bm-button').setAttribute('id', `edit${index}`);
            bookmarksListItemTempClone.querySelector('.edit-bm-button').setAttribute('bmIndex', index);
            bookmarksListItemTempClone.querySelector('.edit-bm-icon').setAttribute('bmIndex', index);
            bookmarksList.append(bookmarksListItemTempClone);

            bmButtons.push(index);
        });

    }

    bmButtons.forEach(index => {
        document.getElementById(`remove${index}`).addEventListener('click', (e) => {
            removeBookmark(e.target.attributes.bmIndex.value);
        });

        document.getElementById(`edit${index}`).addEventListener('click', (e) => {
            editBookmark(e.target.attributes.bmIndex.value);
        });
    })
}

function removeBookmark(index) {
    getProperty('bookmarks').then(res => {
        if (res.bookmarks) {
            res.bookmarks.splice(index, 1);
            setProperty('bookmarks', res.bookmarks);
            if(res.bookmarks.length>0) {
                createBookmarksElements(res.bookmarks);
            } else {
                createNoBookmarksElement();
            }
        }
    })
}

function editBookmark(index) {
    getProperty('bookmarks').then(res => {
        if (res.bookmarks) {
            var attribute = bookmarkAddButton.getAttribute('fn');
            if (attribute === 'close') {
                bookmarkAddButton.click();
            }
            bookmarkAddButton.click();
            const title = res.bookmarks[index].title;
            const url = res.bookmarks[index].url;
            addingBookmarkFormElement[0].value = title;
            addingBookmarkFormElement[1].value = url;
            addingBookmarkFormElement[3].value = index;
        }
    })
}

function createNoBookmarksElement() {
    bookmarkItems.replaceChildren();
    const noBookmarkTempClone = noBookmarkTemp.content.cloneNode(true);
    bookmarkItems.append(noBookmarkTempClone);
    bookmarksList.style.display = 'none';
    translatePage();
}

function updateBookmark(title, url, index) {
    getProperty('bookmarks').then(res => {
        let bookmarks = res.bookmarks;
        bookmarks[index].title = title;
        bookmarks[index].url = url;
        createBookmarksElements(bookmarks);
        setProperty('bookmarks', bookmarks);
    })
}

function insertBookmark(title, url) {
    url = url.trim();
    if (!url.startsWith('http')) {
        url = 'http://' + url;
    }
    let item = {
        // url has to be with http or https
        url,
        title
    }
    getProperty('bookmarks').then(res => {
        let bookmarks = res.bookmarks || [];
        bookmarks.push(item);
        createBookmarksElements(bookmarks);
        setProperty('bookmarks', bookmarks);
    })
}

function addBookmark(e) {
    e.preventDefault();
    const title = e.target[0].value;
    const url = e.target[1].value;
    const index = addingBookmarkFormElement[3].value;
    if (index && index >= 0) {
        updateBookmark(title, url, index);
    } else {
        insertBookmark(title, url);
    }
    hideAndResetAddBookmarkForm();
}

function showAddBookmarkForm(e) {
    var attribute = bookmarkAddButton.getAttribute('fn');
    if (attribute === 'open') {
        openBookmarkForm();
    } else {
        closeBookmarkForm();
    }
    translatePage();
}

function openBookmarkForm() {
    document.getElementById('add-bookmark-wrapper').style.display = 'block';
    bookmarkAddButton.setAttribute('i18n-title', 'close-bookmark-form');
    bookmarkAddButton.setAttribute('fn', 'close');
    bookmarkAddButton.innerHTML = '<span class="material-icons">close</span>';
}

function closeBookmarkForm() {
    document.getElementById('add-bookmark-wrapper').style.display = 'none';
    bookmarkAddButton.setAttribute('i18n-title', 'open-bookmark-form');
    bookmarkAddButton.setAttribute('fn', 'open');
    bookmarkAddButton.innerHTML = '<span class="material-icons">add</span>';
    addingBookmarkFormElement.reset();
}

function hideAndResetAddBookmarkForm() {
    addingBookmarkFormElement.reset();
    document.getElementById('add-bookmark-wrapper').style.display = 'none';
    closeBookmarkForm();
}

// #endregion

/*
    --- WEATHER ---
*/
// #region

function submitCity(e) {
    e.preventDefault();
    let newCity = e.target[0].value.split(',')[0].toLowerCase();
    getProperty('city').then((res) => {
        if (res.city && res.city.city.toLowerCase() === newCity) {
            return;
        } else {
            changeWeatherCity(e.target[0].value)
            cityForm.reset();
        }
    })
}

async function changeWeatherCity(cityName) {
    getData(`http://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=80e6f5de92ca33e4ee524c0a0206c13b&units=metric&lang=${lang}`).then(data => {
        const lat = data.coord.lat;
        const lon = data.coord.lon;
        const country = data.sys.country;
        const city = data.name;
        setProperty('city', {
            city,
            country,
            lat,
            lon
        });
        fetchNewWeatherData(lat, lon, city, country);
    })
}

function getSavedWeatherData() {
    getProperty('city').then(res => {
        if (res.city) {
            getProperty('weatherData').then(data => {
                if (data.weatherData) {
                    if (data.weatherData.lang === lang) {
                        const diff = (Date.now() - data.weatherData.time) / 60 / 60 / 1000;
                        if (diff < 2) {
                            createWeatherBlock(data.weatherData.data);
                            cityInputElement.value = res.city.city + ', ' + res.city.country;
                            weatherElement.style.display = 'block';
                        } else {
                            fetchNewWeatherData(res.city.lat, res.city.lon, res.city.city, res.city.country)
                        }
                    } else {
                        fetchNewWeatherData(res.city.lat, res.city.lon, res.city.city, res.city.country)
                    }
                } else {
                    fetchNewWeatherData(res.city.lat, res.city.lon, res.city.city, res.city.country)
                }
            })
        } else {
            weatherElement.style.display = 'block';
            generateNoCityCode();
        }
    })
}

function fetchNewWeatherData(lat, lon, city, country) {
    fetchWeather(lat, lon);
    cityInputElement.value = city + ', ' + country;
    weatherElement.style.display = 'block';
}

function generateNoCityCode() {
    weatherInfo.innerHTML = `
    <div id="no-city" class="no-city">
        <span i18n-key="no-city-msg"></span>
    </div>
    `
    document.getElementById('click-me-info').style.display = 'none'
    translatePage();
}

async function fetchWeather(lat, lon) {
    getData(`http://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&appid=80e6f5de92ca33e4ee524c0a0206c13b&units=metric&lang=${lang}&exclude=minutely,hourly,alerts`).then(data => {
        createWeatherBlock(data)
        setProperty('weatherData', {
            data,
            time: Date.now(),
            lang
        });
    })
}

function readInitWeatherState() {
    getProperty('showWeather').then(res => {
        if (res.showWeather) {
            getSavedWeatherData();
            toggleWeatherElement.checked = true;
        } else if (res.showWeather === false) {
            toggleCityForm(true);
            weatherElement.style.display = 'none';
            toggleWeatherElement.checked = false;
        } else {
            setProperty('showWeather', true);
            readInitWeatherState();
        }
    })
}

function toggleCityForm(disable) {
    cityInputElement.disabled = disable;
    cityButtonElement.disabled = disable;
}

function fixTimeFormat(time) {
    let hours = time.getHours();
    let minutes = time.getMinutes();
    hours = (hours < 10) ? '0' + hours : hours;
    minutes = (minutes < 10) ? '0' + minutes : minutes;
    return `${hours}:${minutes}`;
}

async function createWeatherBlock(data) {
    const cityObj = await getProperty('city')
    const country = cityObj.city.country;
    const city = cityObj.city.city;
    const current = data.current;
    const daily = data.daily[0];
    const refreshTime = new Date(current.dt * 1000);
    const currentTemp = Math.round(current.temp);
    const maxTemp = Math.round(daily.temp.max);
    const minTemp = Math.round(daily.temp.min);
    const feelLike = Math.round(current.feels_like)
    const sunrise = new Date(daily.sunrise * 1000);
    const sunset = new Date(daily.sunset * 1000);
    const description = lang === 'sr' ? convertCyrillicToLatin(current.weather[0].description) : current.weather[0].description;
    
    weatherInfo.replaceChildren();
    const weatherTempClone = weatherTemp.content.cloneNode(true);
    weatherTempClone.querySelector('.city').innerText =`${city}, `;
    weatherTempClone.querySelector('.country').innerText =country;
    weatherTempClone.querySelector('.weather-icon').setAttribute('src', `http://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png`);
    weatherTempClone.querySelector('#description').innerText =description;
    weatherTempClone.querySelector('.current-temp').innerText = `${currentTemp} ${String.fromCharCode(8451)}`;
    weatherTempClone.querySelector('#min-temp').innerText =`${minTemp} ${String.fromCharCode(8451)}`;
    weatherTempClone.querySelector('#max-temp').innerText =`${maxTemp} ${String.fromCharCode(8451)}`;
    weatherTempClone.querySelector('#feel-like').innerText =`${feelLike} ${String.fromCharCode(8451)}`;
    weatherTempClone.querySelector('#humidity').innerText = `${current.humidity}%`;
    weatherTempClone.querySelector('#pressure').innerText =`${current.pressure} mb`;
    weatherTempClone.querySelector('#wind-speed').innerText =current.wind_speed;
    weatherTempClone.querySelector('#sunrise').innerText =fixTimeFormat(sunrise);
    weatherTempClone.querySelector('#sunset').innerText =fixTimeFormat(sunset);
    weatherTempClone.querySelector('#refresh-time').innerText =fixTimeFormat(refreshTime);
    weatherInfo.append(weatherTempClone);
    
    translatePage();
}

// #endregion

/*
    --- SEARCH ---
*/
// #region

function readInitSearchState() {
    getProperty('searchEng').then(res => {
        if (res.searchEng) {
            searchOptions.value = res.searchEng;
            searchEngChange(res.searchEng);
        } else {
            setProperty('searchEng', 'google');
            readInitSearchState();
        }
    })
}

function searchEngChange(e) {
    let button = document.getElementById('search-icon');
    setProperty('searchEng', e);
    switch (e) {
        case 'yahoo':
            button.style.backgroundImage = 'url(./assets/images/yahoo-icon.png)';
            selectedSearchEng = 'yahoo';
            break;
        case 'google':
            button.style.backgroundImage = 'url(./assets/images/google-icon.png)'
            selectedSearchEng = 'google'
            break;
        case 'duck':
            button.style.backgroundImage = 'url(./assets/images/duck-icon.png)'
            selectedSearchEng = 'duck'
            break;
    }
}

function submitSearch(e) {
    e.preventDefault();
    const searchTerm = document.getElementById('search-field').value;
    const query = searchTerm.split(' ').join('+');
    var url;
    if (query === '') {
        return;
    }
    switch (selectedSearchEng) {
        case 'yahoo':
            url = `https://search.yahoo.com/search?p=${query}`;
            break;
        case 'google':
            url = `https://www.google.com/search?q=${query}`;
            break;
        case 'duck':
            url = `https://duckduckgo.com/?q=${query}`;
            break;
    }
    searchFormElement.reset();
    browser.tabs.update({
        highlighted: true,
        url: url
    })
}

// #endregion