import { getCSRFToken } from "./csrf.js";
import { currentLayout } from "./layout.js";

const csrftoken = getCSRFToken();

// load current layout 
export function loadBlocks() {
    fetch(`/api/blocks/?layout_name=${currentLayout}`)
        .then(response => response.json())
        .then(data => {
            const canvas = document.getElementById("canvas");
            canvas.innerHTML = "";
            data.forEach(block => {
                const div = createBlockElement(block);
                canvas.appendChild(div);
            });
        });
}

export function addBlock() {
    const canvas = document.getElementById("canvas");
    const width = parseInt(document.getElementById("w-input").value) || 100;
    const height = parseInt(document.getElementById("h-input").value) || 100;

    const newBlockData = {
        x: 50,
        y: 50,
        width,
        height,
        layout_name: currentLayout
    };

    fetch("/api/blocks/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrftoken
        },
        body: JSON.stringify(newBlockData)
    })
        .then(res => res.json())
        .then(data => {
            const div = createBlockElement(data);
            canvas.appendChild(div);
        });
}

function createBlockElement(data) {
    const div = document.createElement("div");
    div.classList.add("block");
    div.style.left = `${data.x}px`;
    div.style.top = `${data.y}px`;
    div.style.width = `${data.width}px`;
    div.style.height = `${data.height}px`;
    div.dataset.id = data.id;

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "✕";
    deleteBtn.classList.add("delete-btn");
    deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const confirmDelete = confirm(`Do you want to delete block ${data.id} ?`);
        if (!confirmDelete) return;

        fetch(`/api/blocks/${data.id}/`, {
            method: "DELETE",
            headers: { "X-CSRFToken": csrftoken }
        }).then(res => {
            if (res.ok) {
                div.remove();
                console.log(`Block ${data.id} is deleted.`);
            } else {
                console.error(`Failed to delete block ${data.id}`);
            }
        });
    });
    div.appendChild(deleteBtn);

    // dragging for blocks
    div.addEventListener("mousedown", (e) => {
        const rect = div.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;
        const isResizingArea = offsetX > rect.width - 16 && offsetY > rect.height - 16;
        if (isResizingArea) return;

        const canvas = document.getElementById("canvas");
        const canvasRect = canvas.getBoundingClientRect();
        const originalX = parseInt(div.style.left);
        const originalY = parseInt(div.style.top);

        function onMouseMove(eMove) {
            let newX = eMove.clientX - canvasRect.left - offsetX;
            let newY = eMove.clientY - canvasRect.top - offsetY;

            newX = Math.max(0, Math.min(newX, canvas.clientWidth - div.offsetWidth));
            newY = Math.max(0, Math.min(newY, canvas.clientHeight - div.offsetHeight));

            div.style.left = `${newX}px`;
            div.style.top = `${newY}px`;
        }

        let hasHandledOverlap = false;

        function onMouseUp() {
            // 避免 overlap alert 重複觸發 
            if (hasHandledOverlap) return; 
            hasHandledOverlap = true;

            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);

            const finalX = parseInt(div.style.left);
            const finalY = parseInt(div.style.top);

            if (isOverlapping(div)) {
                div.style.left = `${originalX}px`;
                div.style.top = `${originalY}px`;
                alert("Block overlapped 將還原位置。");
                return;
            }

            fetch(`/api/blocks/${data.id}/`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrftoken
                },
                body: JSON.stringify({ x: finalX, y: finalY })
            })
                .then(res => res.json())
                .then(updated => {
                    console.log("Position updated:", updated);
                });
        }

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    });

    // 調整大小
    div.addEventListener("mouseup", () => {
        const canvas = document.getElementById("canvas");
        const canvasWidth = canvas.clientWidth;
        const canvasHeight = canvas.clientHeight;
        const left = parseInt(div.style.left);
        const top = parseInt(div.style.top);
        const originalW = data.width;
        const originalH = data.height;

        let newWidth = div.offsetWidth;
        let newHeight = div.offsetHeight;

        newWidth = Math.min(newWidth, canvasWidth - left);
        newHeight = Math.min(newHeight, canvasHeight - top);

        div.style.width = `${newWidth}px`;
        div.style.height = `${newHeight}px`;

        if (isOverlapping(div)) {
            div.style.width = `${originalW}px`;
            div.style.height = `${originalH}px`;
            alert("Block overlapped 將還原位置。");
            return;
        }

        if (newWidth !== originalW || newHeight !== originalH) {
            fetch(`/api/blocks/${data.id}/`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrftoken
                },
                body: JSON.stringify({ width: newWidth, height: newHeight })
            })
                .then(res => res.json())
                .then(updated => {
                    console.log("Size updated:", updated);
                    data.width = newWidth;
                    data.height = newHeight;
                });
        }
    });

    return div;
}

// 檢查是否與其他方格重疊
function isOverlapping(target) {
    const allBlocks = document.querySelectorAll(".block");
    const tRect = target.getBoundingClientRect();

    for (const other of allBlocks) {
        if (other === target) continue;
        const oRect = other.getBoundingClientRect();
        const overlap = !(
            tRect.right <= oRect.left ||
            tRect.left >= oRect.right ||
            tRect.bottom <= oRect.top ||
            tRect.top >= oRect.bottom
        );
        if (overlap) return true;
    }
    return false;
}

// Save layout status
export function saveLayout() {
    const blocks = document.querySelectorAll(".block");

    blocks.forEach(block => {
        const id = block.dataset.id;
        const x = parseInt(block.style.left);
        const y = parseInt(block.style.top);
        const width = block.offsetWidth;
        const height = block.offsetHeight;

        fetch(`/api/blocks/${id}/`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrftoken
            },
            body: JSON.stringify({ x, y, width, height })
        })
            .then(res => res.json())
            .then(updated => {
                console.log(`Layout saved for block ${id}:`, updated);
            })
            .catch(err => {
                console.error(`Failed to save block ${id}:`, err);
            });
    });
}
