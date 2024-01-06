const tozInKg = 32.1507;
const kgInToz = 0.0311;
const gold_legends = ["GC", "GM", "RGC", "FGG", "GB", "UNALLOCATEDGOLDSTORAGE", "RGC"];
const silver_legends = ["SM", "SC", "SB", "UNALLOCATEDSILVERSTORAGE", "RSC"];
const platinum_legends = ["PC", "PB", "UNALLOCATEDPLATINUMSTORAGE"];


/**
 * Takes the name of a spot type `i.e. gold` and sets its value in this.sessionStorage.
 * @param {array} names 
 * @returns undefined
 */
const setSpot = (names, isToz) => {
    names.forEach(type => {
        const name = capitalise(type);
        const element = document.getElementById(`div${name}Spot`);
        const text = element.innerText;
        const number = parseFloat(text);
        const price = isToz ? number * tozInKg : number;

        this.sessionStorage.setItem(`${type}_spot_price`, price);
    });
};

/**
 * Takes an array of spot names and returns the displayed spot value in an object.
 * @param {array} names 
 * @returns object
 */
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

const sessionDataIsSet = (key) => this.sessionStorage.getItem(key) === null ? false : true;
const setSessionData = (key, value) => this.sessionStorage.setItem(key, JSON.stringify(value));
const getSessionData = (key) => JSON.parse(this.sessionStorage.getItem(key));


/**
 * Returns the OZ/KG toggle input element from the UI
 */
const getSpotWeightToggleElement = () => document.getElementById("switchToggleWeight").children[0];


const capitalise = word => word.charAt(0).toUpperCase() + word.slice(1);

/**
 * The card element of store item tells me the data-price and data-grams value.
 * I need to know the OZ or KG spot price.
 * There is no way to deturmine this from the markup. I will need to get the initially listed spot price and then trigger the UI even that switches between dispaying the OZ/KG price. Then grab the updated spot price and compare the two prices. the larger being the KG spot price.
 */

const setStyle = (value) => {
    const bgc = value < 3 ? "#b0ffcb" : value < 6 ? "#ffebb0" : "#ffb2b0";
    const color = value < 3 ? "#165b18" : value < 6 ? "#6e5610" : "#730000";
    return `
        font-weight: bold; 
        background-color: ${bgc}; 
        color: ${color}; 
        padding: 0.2em 0.4em;
        border-radius: 0.2em;`;
}

const cardUI = value => {
    const shell = document.createElement("div");
    const style = setStyle(value);
    shell.setAttribute("class", "d-flex justify-content-end align-items-center gap-1")
    shell.innerHTML = `
        <div style="margin: 0.3em;">
            <span style="${style}">${value}%</span>
        </div>`;
    return shell;
}

const createProductElement = value => {
    const shell = document.createElement("div");
    const style = setStyle(value);
    shell.setAttribute("style", "margin: 0.4em;");
    shell.innerHTML = `<span style="${style}">${value}%</span>`;
    return shell;
}

const findCardType = card => {
    const value = card.previousElementSibling.value;
    const card_type = value.substring(0, value.indexOf("-")).toUpperCase();
    if (gold_legends.some(legend => legend === card_type)) return "gold";
    if (silver_legends.some(legend => legend === card_type)) return "silver";
    if (platinum_legends.some(legend => legend === card_type)) return "platinum";
}

const findOverSpotPercentage = (type, itemPrice, itemWeight) => {
    const spot_price = parseFloat(getSessionData(`${type}_spot_price`));
    const spotValueByWeight = spot_price / (1000/itemWeight);
    const fraction = itemPrice - spotValueByWeight;
    const percentage = fraction / spotValueByWeight * 100;
    return percentage.toFixed(3);
}

const establishPremium = (type, item) => {
    const worse_price = item.querySelector(".card-price").lastElementChild.innerText;
    const sanitised = worse_price.replace(/[\$\,]/g, "");
    const price = parseFloat(sanitised);
    const percentage = findOverSpotPercentage(type, price, item.dataset.grams);
    return percentage;
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
        const href = card.querySelector("a").getAttribute("href");

        if (!sessionDataIsSet(href)) {
            const description = card.querySelector(".card-title").innerText;
            const type = findTypeFromString(description);
            const percentage = establishPremium(type, card);
            const grams = card.dataset.grams;
            setSessionData(href, { type, grams, percentage });
        }
        
        const data = getSessionData(href);
        const element = cardUI(data.percentage);
        const btn = card.querySelector(".w-price-btn");
        btn.insertBefore(element, btn.firstElementChild);
    });
}

const displayDataOnTable = (table, data) => {
    const rows = [...table.querySelectorAll("tr")];
    // rows[0] is the header row
    const hearder_row = table.querySelector("tr");
    const th = document.createElement("th");
    th.innerText = "%";
    hearder_row.insertBefore(th, hearder_row.lastElementChild)
    rows.shift();

    rows.forEach(row => {
        const td = row.firstElementChild.nextElementSibling;
        const sanitised_td = parseFloat(td.innerText.replace(/[\$\,]/g, ""));
        const spot = parseFloat(getSessionData(`${data.type}_spot_price`));
        const SVW = spot / (1000/data.grams);
        const fraction = sanitised_td - SVW;
        const percentage = (fraction / SVW * 100).toFixed(3);
        const element = document.createElement("td");
        element.innerText = percentage;
        row.insertBefore(element, row.lastElementChild);
    });
}


function run () {
    try {
        const subpath = this.location.href.substring(0, --this.location.href.length);
        const isProductPage = this.location.href.includes("/Buy/View/Product/Name/");
        const location = this.location.origin === subpath ? "home" : isProductPage ? "product" : "list";
        
        // Have the spot prices been determined?
        if (this.sessionStorage.getItem("gold_spot_price") === null) {
            // Do stuff the get the spot prices and set them to sessionStorage
            const weight_element = getSpotWeightToggleElement();
            // const currency_element = getSpotCurrencyToggleElement();
            const gold_spot = { then: getSpot(["gold"]).gold, now: undefined };

            weight_element.click();
            gold_spot.now = getSpot(["gold"]).gold;
            setSpot(["gold", "silver", "platinum"], gold_spot.then > gold_spot.now)
        }

        switch (location) {
            case "home":
                homePage()
                break;
            case "product":
                if (!sessionDataIsSet(this.location.pathname)) return;
                console.log(sessionDataIsSet(this.location.pathname));
                const product_data = getSessionData(this.location.pathname);
                const price_col = document.querySelector(".price-col");
                const input_group = price_col.querySelector(".input-group");
                const table = document.querySelector("table");
                const element = createProductElement(product_data.percentage);
                console.log(element)
                price_col.insertBefore(element, input_group);
                if (table) displayDataOnTable(document.querySelector("table"), product_data);
                break;
            case "list":
                const wrapper = document.getElementById("productWrapper");
                [...wrapper.querySelectorAll(".productCard")].forEach(card => {
                    const href = card.querySelector("a").getAttribute("href");
                    if (!sessionDataIsSet(href)) {
                        const worse_price = card.querySelector(".card-price").lastElementChild.innerText;
                        const sanitised = worse_price.replace(/[\$\,]/g, "");
                        const price = parseFloat(sanitised);
                        const grams = card.dataset.grams;
                        const type = findCardType(card);
                        const percentage = findOverSpotPercentage(type, price, grams);
                        setSessionData(href, { type, grams, percentage });
                    }
                    const data = getSessionData(href);
                    const element = cardUI(data.percentage);
                    const btn = card.querySelector(".w-price-btn");
                    btn.insertBefore(element, btn.firstElementChild);
                });
                break;
        }
    } catch (error) {
        console.error("AB Price Over Spot:", error);
    }  
}

run();
