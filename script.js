
let crops = JSON.parse(localStorage.getItem("crops")) || [];
let orders = JSON.parse(localStorage.getItem("orders")) || [];

function saveData() {
    localStorage.setItem("crops", JSON.stringify(crops));
    localStorage.setItem("orders", JSON.stringify(orders));
}

function safe(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// FARMER REGISTRATION

const cropForm = document.getElementById("cropForm");

if (cropForm) {
    cropForm.addEventListener("submit", function(e) {
        e.preventDefault();

        const farmer = document.getElementById("farmerName").value.trim();
        const mobile = document.getElementById("farmerMobile").value.trim();
        const crop = document.getElementById("cropName").value;
        const quantity = Number(document.getElementById("quantity").value);
        const price = Number(document.getElementById("price").value);
        const location = document.getElementById("location").value.trim();

        if (!/^[0-9]{10}$/.test(mobile) ||
            !farmer || !crop || !location ||
            !Number.isFinite(quantity) || quantity <= 0 ||
            !Number.isFinite(price) || price <= 0) {
            alert("Please enter valid details!");
            return;
        }

        crops.push({
            id: Date.now().toString(),
            farmer,
            mobile,
            crop,
            quantity,
            price,
            location
        });

        saveData();
        displayCrops();

        document.getElementById("farmerMessage").textContent =
            "Crop Added Successfully!";

        cropForm.reset();
    });
}

// DISPLAY FARMER CROPS

function displayCrops() {
    const list = document.getElementById("farmerCropList");
    if (!list) return;

    list.innerHTML = "";

    if (crops.length === 0) {
        list.textContent = "No crops registered yet.";
        return;
    }

    crops.forEach(item => {
        const card = document.createElement("div");
        card.className = "crop-card";

        card.innerHTML = `
            <h3>${safe(item.crop)}</h3>
            <p>Farmer: ${safe(item.farmer)}</p>
            <p>Quantity: ${item.quantity} KG</p>
            <p>Price: ₹${item.price}/KG</p>
            <p>Location: ${safe(item.location)}</p>
        `;

        list.appendChild(card);
    });
}

// BUYER CROP SEARCH

function displayBuyerCrops(search = "") {
    const list = document.getElementById("buyerCropList");
    const select = document.getElementById("selectedCrop");

    if (!list || !select) return;

    list.innerHTML = "";
    select.innerHTML = '<option value="">Select Crop</option>';

    const available = crops.filter(item =>
        item.quantity > 0 &&
        item.crop.toLowerCase().includes(search.toLowerCase())
    );

    if (available.length === 0) {
        list.textContent = "No available crops found.";
        return;
    }

    available.forEach(item => {
        const card = document.createElement("div");
        card.className = "crop-card";

        card.innerHTML = `
            <h3>${safe(item.crop)}</h3>
            <p>Farmer: ${safe(item.farmer)}</p>
            <p>Location: ${safe(item.location)}</p>
            <p>Available: ${item.quantity} KG</p>
            <p>Price: ₹${item.price}/KG</p>
        `;

        list.appendChild(card);

        const option = document.createElement("option");
        option.value = item.id;
        option.textContent =
            `${item.crop} - ${item.quantity} KG - ₹${item.price}/KG`;

        select.appendChild(option);
    });
}

const searchInput = document.getElementById("searchCrop");

if (searchInput) {
    displayBuyerCrops();

    searchInput.addEventListener("input", function() {
        displayBuyerCrops(this.value);
    });
}

// BUYER PLACE ORDER

const orderForm = document.getElementById("orderForm");

if (orderForm) {
    orderForm.addEventListener("submit", function(e) {
        e.preventDefault();

        const buyer = document.getElementById("buyerName").value.trim();
        const mobile = document.getElementById("buyerMobile").value.trim();
        const type = document.getElementById("buyerType").value;
        const cropId = document.getElementById("selectedCrop").value;
        const quantity = Number(document.getElementById("orderQuantity").value);

        const selected = crops.find(item => item.id === cropId);

        if (!/^[0-9]{10}$/.test(mobile) ||
            !buyer || !type || !selected ||
            !Number.isFinite(quantity) || quantity <= 0) {
            alert("Please enter valid order details!");
            return;
        }

        if (quantity > selected.quantity) {
            alert("Required quantity is not available!");
            return;
        }

        const total = quantity * selected.price;

        orders.push({
            id: Date.now().toString(),
            buyer,
            mobile,
            type,
            crop: selected.crop,
            farmer: selected.farmer,
            quantity,
            total,
            status: "Pending"
        });

        selected.quantity -= quantity;

        saveData();
        displayBuyerCrops();
        displayCrops();
        updateStatistics();
        displayOrders();

        document.getElementById("buyerMessage").textContent =
            "Order Placed Successfully! Total: ₹" + total;

        orderForm.reset();
    });
}

// ORDER MANAGEMENT

function displayOrders() {
    const list = document.getElementById("orderList");
    if (!list) return;

    list.innerHTML = "";

    if (orders.length === 0) {
        list.textContent = "No orders available.";
        return;
    }

    orders.forEach(item => {
        const card = document.createElement("div");
        card.className = "order-card";

        card.innerHTML = `
            <h3>Order #${safe(item.id)}</h3>
            <p>Buyer: ${safe(item.buyer)}</p>
            <p>Mobile: ${safe(item.mobile)}</p>
            <p>Category: ${safe(item.type)}</p>
            <p>Farmer: ${safe(item.farmer)}</p>
            <p>Crop: ${safe(item.crop)}</p>
            <p>Quantity: ${item.quantity} KG</p>
            <p>Total: ₹${item.total}</p>
            <p class="status">Status: ${safe(item.status)}</p>
        `;

        if (item.status === "Pending") {
            const btn = document.createElement("button");
            btn.textContent = "Approve Order";
            btn.onclick = () => updateOrder(item.id, "Approved");
            card.appendChild(btn);
        }

        if (item.status === "Approved") {
            const btn = document.createElement("button");
            btn.textContent = "Complete Order";
            btn.onclick = () => updateOrder(item.id, "Completed");
            card.appendChild(btn);
        }

        list.appendChild(card);
    });
}

function updateOrder(id, status) {
    const order = orders.find(item => item.id === id);
    if (!order) return;

    order.status = status;

    saveData();
    displayOrders();
    updateStatistics();
}

// DASHBOARD STATISTICS

function updateStatistics() {
    const setText = (id, value) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    };

    setText("totalCrops", crops.filter(c => c.quantity > 0).length);
    setText("totalFarmers", new Set(crops.map(c => c.mobile)).size);
    setText("totalOrders", orders.length);

    setText("allOrders", orders.length);
    setText("pendingOrders",
        orders.filter(o => o.status === "Pending").length);
    setText("approvedOrders",
        orders.filter(o => o.status === "Approved").length);
    setText("completedOrders",
        orders.filter(o => o.status === "Completed").length);
}

// INITIALIZE

displayCrops();
displayBuyerCrops();
displayOrders();
updateStatistics();
