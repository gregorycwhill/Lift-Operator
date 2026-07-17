// ============================================================================
// UI-SHOP.JS : SUPPLY CLOSET, INVENTORY, & PILOT RANKINGS
// ============================================================================

/**
 * Get the pilot rank title based on lift count.
 */
window.getRankByLifts = function(numLifts) {
    if (numLifts <= 1) return "Operator";
    if (numLifts === 2) return "Manager";
    if (numLifts === 3) return "Director";
    if (numLifts === 4) return "Captain";
    if (numLifts === 5) return "Marshal";
    return "Supremo";
};

/**
 * Update the pilot name display in the sidebar.
 */
window.updatePilotNameDisplay = function() {
    const numLifts = (typeof Registry !== 'undefined' && Registry.lifts) ? Registry.lifts.length : 1;
    const ui = GameUI();
    const rank = (typeof ui.getRankByLifts === 'function') ? ui.getRankByLifts(numLifts) : window.getRankByLifts(numLifts);
    const name = (typeof Registry !== 'undefined' && Registry.playerName) ? Registry.playerName : "Pilot";
    
    const pilotDisplay = document.getElementById('pilotNameDisplay');
    if (pilotDisplay) {
        pilotDisplay.innerText = `${rank} ${name}`;
    }
};

/**
 * Add a power-up ability to the shopping cart.
 */
window.addToCart = function(id, tier) {
    if (typeof PowerUps === 'undefined') return;
    const puCost = PowerUps.catalog[id].tiers[tier].cost;
    const currentCartTotal = PowerUps.cart.reduce((sum, item) => sum + PowerUps.catalog[item.id].tiers[item.tier].cost, 0);

    if (Registry.points >= currentCartTotal + puCost) {
        PowerUps.cart.push({ id: id, tier: tier });
        window.renderShop();
    }
};

/**
 * Remove an item from the shopping cart.
 */
window.removeFromCart = function(index) {
    if (typeof PowerUps === 'undefined') return;
    PowerUps.cart.splice(index, 1);
    window.renderShop();
};

/**
 * Deduct points and move cart items into inventory.
 */
window.checkoutCart = function() {
    if (typeof PowerUps === 'undefined') return;
    let totalCost = PowerUps.cart.reduce((sum, item) => sum + PowerUps.catalog[item.id].tiers[item.tier].cost, 0);
    if (Registry.points >= totalCost) {
        Registry.points -= totalCost;
        PowerUps.inventory.push(...PowerUps.cart);
        PowerUps.cart = [];
        window.updateInventoryUI();
    }
};

/**
 * Synchronize the sidebar inventory bar with the actual inventory state.
 */
window.updateInventoryUI = function() {
    if (typeof PowerUps === 'undefined') return;
    
    let invBar = document.getElementById('inventory-bar');
    if (!invBar) return;
    
    invBar.replaceChildren();
    
    if (PowerUps.inventory.length === 0) {
        const empty = document.createElement('span');
        empty.className = 'inventory-empty';
        empty.textContent = 'Empty';
        invBar.appendChild(empty);
        return;
    }
    
    PowerUps.inventory.forEach((item, index) => {
        const pu = PowerUps.catalog[item.id];
        const btn = document.createElement('button');
        
        const isActive = PowerUps.activeTargeting && PowerUps.activeTargeting.id === item.id && PowerUps.activeTargeting.tier === item.tier;
        
        btn.className = `inv-btn inv-btn-t${item.tier + 1} ${isActive ? 'active' : ''}`;
        btn.textContent = pu.icon;
        btn.title = `${pu.name} (Tier ${item.tier + 1})`;
        
        btn.onclick = () => { 
            if (isActive) PowerUps.cancelTargeting();
            else PowerUps.primeAbility(item.id, item.tier); 
        };
        invBar.appendChild(btn);
    });
};

/**
 * Render the "Supply Closet" (Shop) interface and shopping cart.
 */
window.renderShop = function() {
    let shopDiv = document.getElementById('shopContainer');
    if (!shopDiv || typeof PowerUps === 'undefined') return;

    // Capture scroll positions to prevent jumping
    const modalContent = shopDiv.closest('.modal-content');
    const modalScroll = modalContent ? modalContent.scrollTop : 0;
    
    let listContainer = shopDiv.querySelector('.shop-items-grid');
    let gridScroll = listContainer ? listContainer.scrollTop : 0;

    let currentCartTotal = PowerUps.cart.reduce((sum, item) => sum + PowerUps.catalog[item.id].tiers[item.tier].cost, 0);
    let remainingPoints = Registry.points - currentCartTotal;
    let pointsClass = remainingPoints > 0 ? 'text-green' : 'text-red';
    
    shopDiv.replaceChildren();

    const header = document.createElement('h3');
    header.className = 'shop-header';
    header.textContent = 'Supply Closet (Credits: ';
    const pointsSpan = document.createElement('span');
    pointsSpan.className = pointsClass;
    pointsSpan.textContent = remainingPoints;
    header.appendChild(pointsSpan);
    header.appendChild(document.createTextNode(')'));
    shopDiv.appendChild(header);

    const shopContainer = document.createElement('div');
    shopContainer.className = 'shop-container';

    const itemsGrid = document.createElement('div');
    itemsGrid.className = 'shop-items-grid';

    const unlocks = Config.GAME_DATA.shopUnlocks || {};
    const currentRound = Registry.stats.round;
    Object.values(PowerUps.catalog).forEach(pu => {
        pu.tiers.forEach((tier, index) => {
            const unlockRound = unlocks[pu.id]?.[index] || 1;
            if (!Config.debugMode && currentRound < unlockRound) return;
            let canAfford = remainingPoints >= tier.cost;
            const button = document.createElement('button');
            button.className = `shop-btn shop-btn-t${index + 1}`;
            button.disabled = !canAfford;
            button.addEventListener('click', () => {
                const ui = GameUI();
                if (typeof ui.addToCart === 'function') ui.addToCart(pu.id, index);
                else window.addToCart(pu.id, index);
            });
            
            const tierDiv = document.createElement('div');
            tierDiv.className = 'shop-btn-tier';
            tierDiv.textContent = `TIER ${index + 1}`;
            
            const iconDiv = document.createElement('div');
            iconDiv.className = 'shop-btn-icon';
            iconDiv.textContent = pu.icon;
            
            const costStrong = document.createElement('strong');
            costStrong.className = 'shop-btn-cost';
            costStrong.textContent = `${tier.cost} Credits`;
            
            const descSpan = document.createElement('span');
            descSpan.className = 'shop-btn-desc';
            descSpan.textContent = tier.desc;
            
            button.append(tierDiv, iconDiv, costStrong, descSpan);
            itemsGrid.appendChild(button);
        });
    });
    shopContainer.appendChild(itemsGrid);

    if (PowerUps.cart.length > 0) {
        const cartContainer = document.createElement('div');
        cartContainer.className = 'cart-container';

        const cartHeader = document.createElement('div');
        cartHeader.className = 'cart-header';
        
        const cartSpan = document.createElement('span');
        cartSpan.textContent = '🛒 Cart';
        
        const totalSpan = document.createElement('span');
        totalSpan.className = 'cart-total';
        totalSpan.textContent = 'Total Cost: ';
        const totalStrong = document.createElement('strong');
        totalStrong.textContent = `${currentCartTotal} Credits`;
        totalSpan.appendChild(totalStrong);
        
        cartHeader.append(cartSpan, totalSpan);
        cartContainer.appendChild(cartHeader);

        const cartItemsGrid = document.createElement('div');
        cartItemsGrid.className = 'cart-items-grid';

        PowerUps.cart.forEach((item, idx) => {
            const pu = PowerUps.catalog[item.id];
            const cartItem = document.createElement('div');
            cartItem.className = `cart-item cart-item-t${item.tier + 1}`;
            cartItem.title = 'Click to remove';
            
            const iconSpan = document.createElement('span');
            iconSpan.textContent = pu.icon;
            
            const removeSpan = document.createElement('span');
            removeSpan.className = 'cart-item-remove';
            removeSpan.textContent = '×';
            
            cartItem.append(iconSpan, removeSpan);
            cartItem.addEventListener('click', () => {
                const ui = GameUI();
                if (typeof ui.removeFromCart === 'function') ui.removeFromCart(idx);
                else window.removeFromCart(idx);
            });
            cartItemsGrid.appendChild(cartItem);
        });

        cartContainer.appendChild(cartItemsGrid);

        const checkoutBtn = document.createElement('button');
        checkoutBtn.className = 'btn btn-green btn-full-width checkout-btn';
        checkoutBtn.style.display = 'none'; // USER: Redundant, removing in favor of Round Start button
        checkoutBtn.textContent = 'Purchase Power-Ups';
        checkoutBtn.onclick = () => {
            const ui = GameUI();
            if (typeof ui.checkoutCart === 'function') ui.checkoutCart(false); 
            else window.checkoutCart();
            window.renderShop();
        };
        cartContainer.appendChild(checkoutBtn);

        shopContainer.appendChild(cartContainer);
    }

    shopDiv.appendChild(shopContainer);

    // Restore scroll positions
    itemsGrid.scrollTop = gridScroll;
    if (modalContent) modalContent.scrollTop = modalScroll;
};
