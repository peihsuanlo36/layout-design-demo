import { loadBlocks, addBlock, saveLayout } from "./block.js";
import { initLayoutSwitcher } from "./layout.js";

document.addEventListener("DOMContentLoaded", () => {

    const addBtn = document.getElementById("add-block-btn");
    if (addBtn) {
        addBtn.addEventListener("click", addBlock);
    }


    const saveBtn = document.getElementById("save-layout-btn");
    if (saveBtn) {
        saveBtn.addEventListener("click", saveLayout);
    }


    initLayoutSwitcher(loadBlocks);
});
