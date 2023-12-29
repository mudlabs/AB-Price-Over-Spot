const tozInKg = 32.1507;
const kgInToz = 0.0311;

const product_type = {
    "gold": {
        "spot_price": undefined,
        "legends": ["GC", "GM", "RGC", "FGG", "GB", "UnallocatedGoldStorage", "RGC"]
    },
    "silver": {
        "spot_price": undefined,
        "legends": ["SM", "SC", "SB", "UnallocatedSilverStorage", "RSC"]
    },
    "platinum": {
        "spot_price": undefined,
        "legends": ["PC", "PB", "Unallocated Platinum Storage"]
    }

}


/** On the home page we can search the product description of each carousel-item to identify it's product type i.e. Gold */

/**
 * Takes the name of a spot type `i.e. gold` and sets its value in the spot object.
 * @param {array} names 
 * @returns undefined
 */
const setSpot = (names, isToz) => {
    names.forEach(spotName => {
        const name = capitalise(spotName);
        const element = document.getElementById(`div${name}Spot`);
        const text = element.innerText;
        const number = parseFloat(text);

        product_type[spotName].spot_price = isToz ? number * tozInKg : number;
    });
    
};

const getSpot = names => {
    const numbers = {}
    names.forEach(spotName => {
        const name = capitalise(spotName);
        const element = document.getElementById(`div${name}Spot`);
        const text = element.innerText;
        const number = parseFloat(text);
        numbers[spotName] = number;
    })
    return numbers;
}


const spotUIDisplaysAUD = () => {
    const currency = document.getElementById("divGoldCurrency");
    return currency.innerText.trim() === "AU";
}

/**
 * Converts a string into a formatted propper noun string.
 * @param {string} word 
 * @returns string
 */
const capitalise = word => word.charAt(0).toUpperCase() + word.slice(1);

/**
 * Returns the OZ/KG toggle input element from the UI
 */
const getSpotWeightToggleElement = () => document.getElementById("switchToggleWeight").children[0];

/**
 * Returns the OZ/KG toggle input element from the UI
 */
const getSpotCurrencyToggleElement = () => document.getElementById("switchToggleCurrency").children[0];



/**
 * The card element of store item tells me the data-price and data-grams value.
 * I need to know the OZ or KG spot price.
 * There is no way to deturmine this from the markup. I will need to get the initially listed spot price and then trigger the UI even that switches between dispaying the OZ/KG price. Then grab the updated spot price and compare the two prices. the larger being the KG spot price.
 */

const setStyle = (value, isProductPage) => {
    const color = value < 3 ? "#37e13b" : value < 6 ? "#E1B637" : "#e13737";
    const margin = isProductPage ? "margin-top: 0.4em" : "";
    return `font-weight: bold; color: ${color}; ${margin}`;
}

const cardUI = value => {
    const shell = document.createElement("div");
    const style = setStyle(value, false);
    shell.innerHTML = `<div class="d-flex justify-content-end align-items-center gap-1"><div class="card-price"><span class="price-number" style="${style}">${value}%</span></div></div>`;
    return shell;
}

const productUI = value => {
    const style = setStyle(value, true);
    const div = document.createElement("div");
    div.innerText = `${value}%`;
    div.style = style;
    return div;
}

const findCardType = card => {
    const value = card.previousElementSibling.value;
    const card_type = value.substring(0, value.indexOf("-"));
    if (product_type.gold.legends.some(legend => legend === card_type)) return "gold";
    if (product_type.silver.legends.some(legend => legend === card_type)) return "silver";
    if (product_type.platinum.legends.some(legend => legend === card_type)) return "platinum";
}

const findOverSpotPercentage = (type, itemPrice, itemWeight) => {
    const spotValueByWeight = product_type[type].spot_price / (1000/itemWeight);
    const fraction = itemPrice - spotValueByWeight;
    const percentage = fraction / spotValueByWeight * 100;
    console.log(spotValueByWeight, fraction, percentage)
    return percentage.toFixed(3);
}

const establishPremium = (type, item) => {
    const price = parseFloat(item.dataset.price.replace(/\,/g, ""));
    const percentage = findOverSpotPercentage(type, price, item.dataset.grams);
    return { percentage };
}

const findTypeFromString = string => {
    const type = string.includes("Gold")
        ? "gold"
        : string.includes("Silver")
        ? "silver"
        : string.includes("Platinum")
        ? "platinum"
        : undefined;
    return type;
}   

function homePage () {
    const cards = [...document.querySelectorAll(".carousel-item .card")];
    cards.forEach(card => {
        // identify item type
        const description = card.querySelector(".card-title").innerText;
        const type = findTypeFromString(description);
        // make sure we have a type
        if (type === undefined) return;
        // Generate new data for item
        const data = establishPremium(type, card);
        // Build new element for item from data
        const element = cardUI(data.percentage);
        // Insert new element into item dom.
        const item_dom = card.querySelector(".w-price-btn");
        item_dom.insertBefore(element, item_dom.firstElementChild);
    });
}


function run (path) {
    // toggle weight to make sure we have the per kg spot price
    const weight_element = getSpotWeightToggleElement();
    const currency_element = getSpotCurrencyToggleElement();

    const gold_spot = { then: getSpot(["gold"]).gold, now: undefined };

    weight_element.click();

    gold_spot.now = getSpot(["gold"]).gold;
    
    setSpot(["gold", "silver", "platinum"], gold_spot.then > gold_spot.now)
    

    // Determin what page type script to run.
    // 1) Home page for carousel items
    if (path.origin == path.href.substring(0, --path.href.length)) {
        homePage();
        return;
    }
    // 2) Product detail page
    if (path.href.includes("/Buy/View/Product/Name/")) {
        const product = path.href.substring(52, path.href.indexOf("/ID/"));
        const type = findTypeFromString(product);
        if (type === undefined) return;
        // need the listed price
        // need to know the weight
        return;
    }
    // 3) Product list pages
    const wrapper = document.getElementById("productWrapper");
    const cards = [...wrapper.querySelectorAll(".productCard")];
    cards.forEach(card => {
        const sanitised = card.dataset.price.replace(/\,/g, "");
        const price = parseFloat(sanitised);
        const grams = card.dataset.grams;
        const type = findCardType(card);
        const percentage = findOverSpotPercentage(type, price, grams);
        const ui = cardUI(percentage);
        const box = card.querySelector(".w-price-btn");
        box.insertBefore(ui, box.firstElementChild)
    });

   product_type.gold.spot_price = undefined;
   product_type.silver.spot_price = undefined;
   product_type.platinum.spot_price = undefined;
}

run(this.location);
