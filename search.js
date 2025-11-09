// Courtesy https://github.com/getzola/zola/blob/master/docs/static/search.js

function debounce(func, wait) {
  let timeout;

  return function () {
    let context = this;
    let args = arguments;
    clearTimeout(timeout);

    timeout = setTimeout(function () {
      timeout = null;
      func.apply(context, args);
    }, wait);
  };
}

// Taken from mdbook
// The strategy is as follows:
// First, assign a value to each word in the document:
//  Words that correspond to search terms (stemmer aware): 40
//  Normal words: 2
//  First word in a sentence: 8
// Then use a sliding window with a constant number of words and count the
// sum of the values of the words within the window. Then use the window that got the
// maximum sum. If there are multiple maximas, then get the last one.
// Enclose the terms in <b>.
function makeTeaser(body, terms) {
  let TERM_WEIGHT = 40;
  let NORMAL_WORD_WEIGHT = 2;
  let FIRST_WORD_WEIGHT = 8;
  let TEASER_MAX_WORDS = 10;

  let stemmedTerms = terms.map(function (w) {
    return elasticlunr.stemmer(w.toLowerCase());
  });
  let termFound = false;
  let index = 0;
  let weighted = []; // contains elements of ["word", weight, index_in_document]

  // split in sentences, then words
  let sentences = body.toLowerCase().split(". ");

  for (let i in sentences) {
    let words = sentences[i].split(" ");
    let value = FIRST_WORD_WEIGHT;

    for (let j in words) {
      let word = words[j];

      if (word.length > 0) {
        for (let k in stemmedTerms) {
          if (elasticlunr.stemmer(word).startsWith(stemmedTerms[k])) {
            value = TERM_WEIGHT;
            termFound = true;
          }
        }
        weighted.push([word, value, index]);
        value = NORMAL_WORD_WEIGHT;
      }

      index += word.length;
      index += 1;  // ' ' or '.' if last word in sentence
    }

    index += 1;  // because we split at a two-char boundary '. '
  }

  if (weighted.length === 0) {
    return body;
  }

  let windowWeights = [];
  let windowSize = Math.min(weighted.length, TEASER_MAX_WORDS);
  // We add a window with all the weights first
  let curSum = 0;
  for (let i = 0; i < windowSize; i++) {
    curSum += weighted[i][1];
  }
  windowWeights.push(curSum);

  for (let i = 0; i < weighted.length - windowSize; i++) {
    curSum -= weighted[i][1];
    curSum += weighted[i + windowSize][1];
    windowWeights.push(curSum);
  }

  // If we didn't find the term, just pick the first window
  let maxSumIndex = 0;
  if (termFound) {
    let maxFound = 0;
    // backwards
    for (let i = windowWeights.length - 1; i >= 0; i--) {
      if (windowWeights[i] > maxFound) {
        maxFound = windowWeights[i];
        maxSumIndex = i;
      }
    }
  }

  let teaser = [];
  let startIndex = weighted[maxSumIndex][2];
  for (let i = maxSumIndex; i < maxSumIndex + windowSize; i++) {
    let word = weighted[i];
    if (startIndex < word[2]) {
      // missing text from index to start of `word`
      teaser.push(body.substring(startIndex, word[2]));
      startIndex = word[2];
    }

    // add <em/> around search terms
    if (word[1] === TERM_WEIGHT) {
      teaser.push("<b>");
    }
    startIndex = word[2] + word[0].length;
    teaser.push(body.substring(word[2], startIndex));

    if (word[1] === TERM_WEIGHT) {
      teaser.push("</b>");
    }
  }
  teaser.push("…");
  return teaser.join("");
}

function formatSearchResultItem(item, terms) {
  return (
  `
    <div class="search-results__item">
      <a href="${item.ref}">${item.doc.title}</a>
      <div>${makeTeaser(item.doc.body, terms)}</div>
    </div>
  `);
}

let index;
function initSearch() {
  let searchInput = document.getElementById("search");
  let searchResults = document.querySelector(".search-results");
  let searchResultsItems = document.querySelector(".search-results__items");

  let MAX_ITEMS = 10;

  let options = {
    bool: "AND",
    fields: {
      title: { boost: 2 },
      body: { boost: 1 },
    }
  };
  let currentTerm = "";

  let initIndex = async function () {
    if (index === undefined) {
      index = fetch("/search_index.en.json")
        .then(
          async function (response) {
            return await elasticlunr.Index.load(await response.json());
          }
        );
    }
    let res = await index;
    return res;
  }

  searchInput.addEventListener("keyup", debounce(async function () {
    let term = searchInput.value.trim();
    if (term === currentTerm) {
      return;
    }
    searchResults.style.display = term === "" ? "none" : "flex";
    searchResultsItems.innerHTML = "";
    currentTerm = term;
    if (term === "") {
      return;
    }

    let results = (await initIndex()).search(term, options);

    if (results.length === 0) {
      searchResults.style.display = "none";
      return;
    }

    for (let i = 0; i < Math.min(results.length, MAX_ITEMS); i++) {
      let item = document.createElement("li");
      item.innerHTML = formatSearchResultItem(results[i], term.split(" "));
      searchResultsItems.appendChild(item);
    }
  }, 150));

  window.addEventListener('click', function (e) {
    if (searchResults.style.display == "flex" && !searchResults.contains(e.target)) {
      searchResults.style.display = "none";
    }
  });
}


if (document.readyState === "complete" ||
  (document.readyState !== "loading" && !document.documentElement.doScroll)
) {
  initSearch();
} else {
  document.addEventListener("DOMContentLoaded", initSearch);
}