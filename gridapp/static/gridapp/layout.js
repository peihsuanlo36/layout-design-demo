import { getCSRFToken } from "./csrf.js";

export let currentLayout = "default";
const csrftoken = getCSRFToken();

export function initLayoutSwitcher(loadBlocks) {
    const select = document.getElementById("layout-select");
    const input = document.getElementById("new-layout-input");
    const switchBtn = document.getElementById("layout-switch-btn");
    const saveBtn = document.getElementById("save-layout-btn");


    fetch("/layouts/")
        .then(res => res.json())
        .then(layouts => {
            select.innerHTML = ""; 
            layouts.forEach(name => {
                const option = document.createElement("option");
                option.value = name;
                option.textContent = name;
                select.appendChild(option);
            });


            if (layouts.length > 0) {
                currentLayout = layouts[0];
                select.value = currentLayout;
                loadBlocks(); 
            }
        });


    switchBtn.addEventListener("click", () => {
        const newLayoutName = input.value.trim();
        const selectedLayout = select.value;


        currentLayout = newLayoutName || selectedLayout || "default";

        console.log("Switch layout：", currentLayout);


        const canvas = document.getElementById("canvas");
        canvas.innerHTML = "";
        loadBlocks();


        if (newLayoutName && !Array.from(select.options).some(opt => opt.value === newLayoutName)) {
            const option = document.createElement("option");
            option.value = newLayoutName;
            option.textContent = newLayoutName;
            select.appendChild(option);
        }

        input.value = "";
        select.value = currentLayout;
    });


    saveBtn.addEventListener("click", () => {
        saveCurrentBlocks();
        alert(`Layout 「${currentLayout}」is saved!`);
    });
}


function saveCurrentBlocks() {
    const blocks = document.querySelectorAll(".block");
    blocks.forEach(div => {
        const id = div.dataset.id;
        const x = parseInt(div.style.left);
        const y = parseInt(div.style.top);
        const width = div.offsetWidth;
        const height = div.offsetHeight;

        fetch(`/api/blocks/${id}/`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrftoken
            },
            body: JSON.stringify({ x, y, width, height })
        }).then(res => {
            if (!res.ok) {
                console.warn("Updating block is failed, id:", id);
            }
        });
    });
}
