// Courtesy https://gomakethings.com/how-to-create-a-web-component-with-vanilla-js/

// Zola needs to "see" the files from imports in scss files to add it to the public folder.
// Because I want to play with webcomponent, I inline the svg in this file. Thus, there is zero dependencies.
const sun_svg = `
    <svg width="60" height="60" xmlns="http://www.w3.org/2000/svg">
        <!-- Sun rays -->
        <g>
            <title>Layer 1</title>
            <g id="svg_10">
                <circle id="svg_1" fill="#FFD700" r="12" cy="30" cx="30" />
                <line id="svg_2" stroke-width="2" stroke="#FFD700" y2="6" x2="30" y1="10" x1="30" />
                <line id="svg_3" stroke-width="2" stroke="#FFD700" y2="54" x2="30" y1="50" x1="30" />
                <line id="svg_4" stroke-width="2" stroke="#FFD700" y2="30" x2="6" y1="30" x1="10" />
                <line id="svg_5" stroke-width="2" stroke="#FFD700" y2="30" x2="54" y1="30" x1="50" />
                <line id="svg_6" stroke-width="2" stroke="#FFD700" y2="11" x2="11" y1="15" x1="15" />
                <line id="svg_7" stroke-width="2" stroke="#FFD700" y2="49" x2="49" y1="45" x1="45" />
                <line id="svg_8" stroke-width="2" stroke="#FFD700" y2="49" x2="11" y1="45" x1="15" />
                <line id="svg_9" stroke-width="2" stroke="#FFD700" y2="11" x2="49" y1="15" x1="45" />
            </g>
        </g>
    </svg>
`;
const sun_svg_64 = `data:image/svg+xml;base64,${window.btoa(sun_svg)}`;

const moon_svg = `
    <svg width="162" height="162" xmlns="http://www.w3.org/2000/svg">
    <g>
    <title>Layer 1</title>
    <g id="svg_7">
                <ellipse stroke-width="12" ry="81" rx="81" id="svg_1" cy="81" cx="81" stroke="#DDDDDD"
                fill="#ffffff" />
                <ellipse ry="26.95" rx="27.5" id="svg_2" cy="39.95" cx="111.5" stroke-width="12"
                stroke="#DDDDDD" fill="#ffffff" />
                <ellipse ry="16.66" rx="17" id="svg_4" cy="37.66001" cx="34" stroke-width="12"
                stroke="#DDDDDD" fill="none" />
                <ellipse ry="14.7" rx="15" id="svg_5" cy="103.96001" cx="83" stroke-width="12"
                stroke="#DDDDDD" fill="#ffffff" />
                </g>
                </g>
    </svg>
`;
const moon_svg_64 = `data:image/svg+xml;base64,${window.btoa(moon_svg)}`;


/**
 * A Picker between dark and light mode
 */
class ColorSchemePicker extends HTMLElement {
    /**
     * The class constructor object
    */
    constructor() {
        // Always call super first in constructor
        super();

        /**
         * Handling color scheme choice.
         * Courtesy: https://css-tricks.com/a-complete-guide-to-dark-mode-on-the-web/#combining
         * */
        // User preferences
        this.prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");

        // Checking the user already did choose a custom theme.
        const currentTheme = localStorage.getItem("theme");
        if (currentTheme === null) {
            // Fallback to preference.
            if (this.prefersDarkScheme.matches) {
                currentTheme = "dark";
            } else {
                currentTheme = "light";
            }
            localStorage.setItem("theme", currentTheme);
        }

        if (currentTheme == "dark") {
            document.documentElement.classList.add("dark-theme");
        }

        this.addEventListener('click', () => {
            document.documentElement.classList.toggle("dark-theme");
            const theme = document.documentElement.classList.contains("dark-theme")
                ? "dark"
                : "light";
            localStorage.setItem("theme", theme);
        });
    }

    /**
     * Runs each time the element is appended to or moved in the DOM
    */
    connectedCallback() {
        const themePicker = document.createElement("div");
        themePicker.setAttribute("class", "theme-picker");

        /* Clouds */
        const cloudsContainer = document.createElement('div');
        cloudsContainer.setAttribute('class', 'clouds-container')

        const cloudStyles = [
            'top: 10px; left: calc(60% + 7px)',
            'top: 10px; left: calc(60% + 7px)',
            'top: 10px; left: calc(60% + 12px)',
            'top: 13px; left: calc(60% + 5px)',
            'top: 13px; left: calc(60% + 10px)',
            'top: 13px; left: calc(60% + 15px)',
            'top: 20px; left: calc(50%)',
            'top: 20px; left: calc(50% + 5px)',
            'top: 23px; left: calc(50% - 2px)',
            'top: 23px; left: calc(50% + 3px)',
            'top: 23px; left: calc(50% + 8px)'
        ];
        for (const cloudStyle of cloudStyles) {
            const cloud = document.createElement('div');
            cloud.setAttribute("class", "dot");
            cloud.setAttribute('style', `background: white; width: 10px; height: 10px; ${cloudStyle}`)
            cloudsContainer.appendChild(cloud);
        }

        /* Stars */
        const starsContainer = document.createElement('div');
        starsContainer.setAttribute('class', 'stars-container')

        const starStyles = [
            'background: gray; width: 5px; height: 5px; top: 5px; left: 10px;',
            'background: color-mix(in srgb, gray, white); width: 10px; height: 10px; top: 10px; left: 30px;',
            'background: white; width: 1px; height: 1px; top: 25px; left: 25px;',
            'background: white; width: 5px; height: 5px; top: 30px; left: 10px;',
            'background: yellow; width: 3px; height: 3px; top: 32px; left: 40px;'
        ];
        for (const starStyle of starStyles) {
            const star = document.createElement('div');
            star.setAttribute("class", "dot");
            star.setAttribute('style', starStyle)
            starsContainer.appendChild(star);
        }

        const style = document.createElement('style');
        style.textContent = `
            .theme-picker {
                scale: 0.7;
                height: 3rem;
                aspect-ratio: 2;
                display: flex;
                border-radius: 20px;
                outline: none;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                transition: all 0.5s linear;
                background: linear-gradient(90deg, #1f5cc1 0%, #00d4ff 100%);
                box-shadow:inset 0 5px 15px #0006,inset 0 -5px 15px #fff6;
            }

            :root.dark-theme .theme-picker {
                background: linear-gradient(90deg, rgb(42,39,42) 0%, rgb(48,41,82) 50%, rgb(17,22,96) 100%);
            }

            .theme-picker:hover {
                cursor: pointer;
            }
            .theme-picker:after {
                content: "";
                display: flex;
                height: 80%;
                aspect-ratio: 1;
                border-radius: 100%;
                margin-left: 4px;
                align-self: flex-start;
                box-shadow: 0 5px 10px 9px #0003;
                background-image: url('${sun_svg_64}');
                background-size: 100%;
                background-repeat: no-repeat;
                background-position: 50% 50%;
                transition: all 0.3s linear;
            }

            :root.dark-theme .theme-picker:after {
                background-image:  url('${moon_svg_64}');
                transform:translate(125%);
            }

            /* Clouds container */
            .theme-picker .clouds-container {
                position: relative;
                width: 100%;
                height: 0;
                opacity: 1;
                transition: opacity 0.3s ease;
            }

            :root.dark-theme .clouds-container{
                opacity:0
            }

            /* Stars container */
            .theme-picker .stars-container {
                position:relative;
                width: 100%;
                height: 0;
                opacity: 0;
                transition: opacity .3s ease
            }

            :root.dark-theme .theme-picker .stars-container {
                opacity:1
            }

            /* Dots (stars or clouds) */
            .theme-picker .dot {
                position: absolute;
                border-radius: 100%;
            }
        `;

        this.appendChild(style);
        this.appendChild(themePicker);
        themePicker.appendChild(cloudsContainer);
        themePicker.appendChild(starsContainer);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name == "theme") {

        }
        print("attribute changed", name)
    }

    /**
     * Runs when the element is removed from the DOM
    */
    disconnectedCallback() {
        console.log('disconnected', this);
    }
}


// Define the new web component
if ('customElements' in window) {
    customElements.define('color-scheme-picker', ColorSchemePicker);
}