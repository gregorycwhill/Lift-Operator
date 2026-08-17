// ============================================================================
// UI-SHOP.JS : SUPPLY CLOSET, INVENTORY, & PILOT RANKINGS
// ============================================================================

/**
 * Get the campaign rank title from authored round progression.
 */
window.getCampaignRank = function(round = Registry?.stats?.round) {
    return Config.GAME_DATA.rounds[round]?.briefing?.rank || 'Trainee';
};

/**
 * Update the pilot name display in the sidebar.
 */
window.updatePilotNameDisplay = function() {
    const ui = GameUI();
    const rank = (typeof ui.getCampaignRank === 'function')
        ? ui.getCampaignRank(Registry?.stats?.round)
        : window.getCampaignRank(Registry?.stats?.round);
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
        window.Game.Audio?.publish('shop_item_selected', { id, tier, cost: puCost });
        window.renderShop();
    }
};

/**
 * Remove an item from the shopping cart.
 */
window.removeFromCart = function(indexOrId, tier) {
    if (typeof PowerUps === 'undefined') return;
    const index = typeof indexOrId === 'number'
        ? indexOrId
        : PowerUps.cart.findIndex(item => item.id === indexOrId && item.tier === tier);
    if (index >= 0) PowerUps.cart.splice(index, 1);
    window.renderShop();
};

/**
 * Deduct points and move cart items into inventory.
 */
window.checkoutCart = function() {
    if (typeof PowerUps === 'undefined') return;
    let totalCost = PowerUps.cart.reduce((sum, item) => sum + PowerUps.catalog[item.id].tiers[item.tier].cost, 0);
    if (Registry.points >= totalCost) {
        const purchased = PowerUps.cart.slice();
        Registry.points -= totalCost;
        Registry.roundStats.creditsSpent = (Registry.roundStats.creditsSpent || 0) + totalCost;
        PowerUps.inventory.push(...purchased);
        PowerUps.cart = [];
        purchased.forEach(item => window.Game.Audio?.publish('purchase_confirmed', { id: item.id, tier: item.tier, cost: PowerUps.catalog[item.id].tiers[item.tier].cost }));
        window.updateInventoryUI();
        // A campaign checkpoint is deliberately pre-round: Credits are only
        // committed once the cart is purchased, never while merely reserved.
        window.Game.Campaign?.saveCurrent?.({
            points: Registry.points,
            inventory: PowerUps.inventory
        });
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
    
    const grouped = new Map();
    PowerUps.inventory.forEach(item => {
        const key = `${item.id}:${item.tier}`;
        const entry = grouped.get(key) || { item, count: 0 };
        entry.count++;
        grouped.set(key, entry);
    });
    grouped.forEach(({ item, count }) => {
        const pu = PowerUps.catalog[item.id];
        const btn = document.createElement('button');
        
        const isActive = PowerUps.activeTargeting && PowerUps.activeTargeting.id === item.id && PowerUps.activeTargeting.tier === item.tier;
        
        btn.className = `inv-btn inv-btn-t${item.tier + 1} ${isActive ? 'active' : ''}`;
        btn.textContent = pu.icon;
        const tierName = ['Bronze', 'Silver', 'Gold'][item.tier] || `Tier ${item.tier + 1}`;
        btn.title = `${pu.name} (${tierName}) — ${count} available`;
        if (count > 1) {
            const badge = document.createElement('span');
            badge.className = 'quantity-badge';
            badge.textContent = String(count);
            btn.appendChild(badge);
        }
        
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
    const scrollRegion = shopDiv.querySelector('.shop-scroll-region');
    const shopScroll = scrollRegion ? scrollRegion.scrollTop : 0;

    let currentCartTotal = PowerUps.cart.reduce((sum, item) => sum + PowerUps.catalog[item.id].tiers[item.tier].cost, 0);
    let remainingPoints = Registry.points - currentCartTotal;
    let pointsClass = remainingPoints > 0 ? 'text-green' : 'text-red';
    
    shopDiv.replaceChildren();

    const header = document.createElement('h3');
    header.className = 'shop-header';
    header.textContent = 'Supply Closet (Credits carry forward: ';
    const pointsSpan = document.createElement('span');
    pointsSpan.className = pointsClass;
    pointsSpan.textContent = remainingPoints;
    header.appendChild(pointsSpan);
    header.appendChild(document.createTextNode(`) · Fleet: ${Registry.lifts.length} lifts · ${Config.numFloors} floors`));
    shopDiv.appendChild(header);

    const shopContainer = document.createElement('div');
    shopContainer.className = 'shop-container';

    const scrollContainer = document.createElement('div');
    scrollContainer.className = 'shop-scroll-region';

    const shopLayout = document.createElement('div');
    shopLayout.className = 'shop-layout';

    const itemsGrid = document.createElement('div');
    itemsGrid.className = 'shop-items-grid';

    const unlocks = Config.GAME_DATA.shopUnlocks || {};
    const currentRound = Registry.stats.round;
    Object.values(PowerUps.catalog).forEach(pu => {
        if (!PowerUps.isPowerUpAvailableForRound(pu.id, currentRound)) return;
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
            tierDiv.textContent = ['Bronze', 'Silver', 'Gold'][index] || `Tier ${index + 1}`;
            
            const iconDiv = document.createElement('div');
            iconDiv.className = 'shop-btn-icon';
            iconDiv.textContent = pu.icon;
            
            const costStrong = document.createElement('strong');
            costStrong.className = 'shop-btn-cost';
            costStrong.textContent = `${tier.cost} Credits`;
            
            const descSpan = document.createElement('span');
            descSpan.className = 'shop-btn-desc';
            descSpan.textContent = tier.desc;
            const scopeSpan = document.createElement('span');
            scopeSpan.className = 'shop-btn-scope';
            scopeSpan.textContent = PowerUps.getScopeLabel(pu.id, index);
            
            button.append(tierDiv, iconDiv, costStrong, descSpan, scopeSpan);
            itemsGrid.appendChild(button);
        });
    });
    const cartContainer = document.createElement('aside');
        cartContainer.className = 'cart-container';

        const cartHeader = document.createElement('div');
        cartHeader.className = 'cart-header';
        
        const cartSpan = document.createElement('span');
        cartSpan.textContent = '🛒';
        cartSpan.setAttribute('aria-label', 'Shopping cart');
        cartSpan.title = 'Shopping cart';
        
        const totalSpan = document.createElement('span');
        totalSpan.className = 'cart-total';
        totalSpan.textContent = `${currentCartTotal} Credits`;
        totalSpan.title = 'Total selected power-up Credits';
        
        cartHeader.append(cartSpan, totalSpan);
        cartSpan.textContent = '🛒';
        cartContainer.appendChild(cartHeader);

        const cartItemsGrid = document.createElement('div');
        cartItemsGrid.className = 'cart-items-grid';

        const groupedCart = new Map();
        PowerUps.cart.forEach(item => {
            const key = `${item.id}:${item.tier}`;
            const entry = groupedCart.get(key) || { item, count: 0 };
            entry.count++;
            groupedCart.set(key, entry);
        });
        groupedCart.forEach(({ item, count }) => {
            const pu = PowerUps.catalog[item.id];
            const cartItem = document.createElement('button');
            cartItem.type = 'button';
            cartItem.className = `cart-item cart-item-t${item.tier + 1}`;
            const tierName = ['Bronze', 'Silver', 'Gold'][item.tier] || `Tier ${item.tier + 1}`;
            const effect = pu.tiers[item.tier]?.desc || '';
            const scope = PowerUps.getScopeLabel?.(item.id, item.tier) || '';
            const itemDescription = `${pu.name} — ${tierName}${effect ? `: ${effect}` : ''}. ${count} selected. Click to remove one.`;
            cartItem.title = itemDescription;
            cartItem.setAttribute('aria-label', itemDescription);
            if (scope) {
                const scopedDescription = `${pu.name} (${tierName}, ${scope}). ${count} selected. Click to remove one.`;
                cartItem.title = scopedDescription;
                cartItem.setAttribute('aria-label', scopedDescription);
            }

            const iconSpan = document.createElement('span');
            iconSpan.textContent = pu.icon;
            
            const labelSpan = document.createElement('span');
            labelSpan.className = 'quantity-badge';
            labelSpan.textContent = String(count);
            cartItem.append(iconSpan, labelSpan);
            cartItem.addEventListener('click', () => {
                const ui = GameUI();
                if (typeof ui.removeFromCart === 'function') ui.removeFromCart(item.id, item.tier);
                else window.removeFromCart(item.id, item.tier);
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

    if (PowerUps.cart.length === 0) {
        const emptyCart = document.createElement('div');
        emptyCart.className = 'cart-empty';
        emptyCart.textContent = 'Cart empty';
        cartItemsGrid.appendChild(emptyCart);
    }

    shopLayout.append(itemsGrid, cartContainer);
    scrollContainer.appendChild(shopLayout);
    shopContainer.appendChild(scrollContainer);

    shopDiv.appendChild(shopContainer);

    // Restore scroll positions
    scrollContainer.scrollTop = shopScroll;
};
