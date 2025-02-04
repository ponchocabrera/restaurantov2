'use client';

import React, { useState, useEffect } from 'react';
import {
  Eye,
  Trash2,
  Minimize2,
  Edit2,
  Check,
  X,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import BulkUpload from './BulkUpload';
import { MenuPreview } from '../menu-preview/MenuPreview';
import ImportExportModal from './ImportExportModal';
import { toast } from 'react-hot-toast';
import { generateImage } from '@/services/imageService';

export default function MenuCreator() {
  // -------------------------------------------------------------------------
  // [1] STATE
  // -------------------------------------------------------------------------
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);

  const [menuName, setMenuName] = useState('');
  const [selectedMenuId, setSelectedMenuId] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [menuItems, setMenuItems] = useState([]);
  const [savedMenus, setSavedMenus] = useState([]);
  const [isMenuChanged, setIsMenuChanged] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // For adding new items manually
  const [newItemName, setNewItemName] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemSalesPerformance, setNewItemSalesPerformance] = useState('');
  const [newItemMarginLevel, setNewItemMarginLevel] = useState('');
  const [newItemBoostDesired, setNewItemBoostDesired] = useState(false);

  // Toggle for inline "Add Item" form
  const [showAddItemForm, setShowAddItemForm] = useState(false);

  // AI settings
  const [brandVoice, setBrandVoice] = useState('');
  const [styleWanted, setStyleWanted] = useState('modern');
  const [tone, setTone] = useState('friendly');
  const [showAiSettings, setShowAiSettings] = useState(false);

  // Image enlargement
  const [enlargedImageUrl, setEnlargedImageUrl] = useState(null);
  const [generatingImages, setGeneratingImages] = useState({});

  // Import/Export modal
  const [showImportExport, setShowImportExport] = useState(false);

  // Additional state for search
  const [searchTerm, setSearchTerm] = useState('');

  // Inline editing
  const [editingIndex, setEditingIndex] = useState(-1);
  const [editItemData, setEditItemData] = useState({});

  // -------------------------------------------------------------------------
  // [2] LOAD RESTAURANTS ON MOUNT
  // -------------------------------------------------------------------------
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await fetch('/api/restaurants');
        if (!res.ok) throw new Error('Failed to fetch restaurants');
        const data = await res.json();
        setRestaurants(data.restaurants || []);
      } catch (err) {
        console.error('Error fetching restaurants:', err);
      }
    };
    fetchRestaurants();
  }, []);

  // -------------------------------------------------------------------------
  // [3] SELECTING A RESTAURANT
  // -------------------------------------------------------------------------
  const handleRestaurantSelect = async (restaurantId) => {
    setSelectedRestaurantId(restaurantId);
    setSavedMenus([]);
    setSelectedMenuId(null);
    setMenuName('');
    setMenuItems([]);
    setIsMenuChanged(false);

    if (!restaurantId) return;

    try {
      const res = await fetch(`/api/menus?restaurantId=${restaurantId}`);
      if (!res.ok) throw new Error('Failed to fetch menus');
      const data = await res.json();
      setSavedMenus(data.menus || []);
    } catch (err) {
      console.error('Error fetching menus:', err);
    }
  };

  // -------------------------------------------------------------------------
  // [4] SELECTING AN EXISTING MENU
  // -------------------------------------------------------------------------
  const handleMenuSelect = (menuId) => {
    if (!menuId) {
      // No menu => new menu scenario
      setSelectedMenuId(null);
      setMenuName('');
      setSelectedTemplate('modern');
      setMenuItems([]);
      setIsMenuChanged(false);
      return;
    }

    const existingMenu = savedMenus.find((m) => m.id === menuId);
    setSelectedMenuId(menuId);
    setMenuName(existingMenu?.name || '');
    setSelectedTemplate(existingMenu?.template_id || 'modern');
    fetchMenuItems(menuId);
    setIsMenuChanged(false);
  };

  async function fetchMenuItems(menuId) {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/menuItems?menuId=${menuId}`);
      if (!res.ok) throw new Error('Failed to fetch menu items');
      const data = await res.json();

      setMenuItems(
        data.items.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          image_url: item.image_url || '',
          sales_performance: item.sales_performance,
          margin_level: item.margin_level,
          boost_desired: Boolean(item.boost_desired),
        }))
      );
    } catch (err) {
      console.error('Error fetching menu items:', err);
    } finally {
      setIsLoading(false);
    }
  }

  // -------------------------------------------------------------------------
  // [5] SAVING MENUS & ITEMS
  // -------------------------------------------------------------------------
  async function saveMenuToDB() {
    try {
      if (!selectedRestaurantId) {
        alert('Please select a restaurant first!');
        return;
      }
      setIsLoading(true);

      // Save menu first with correct field names
      const menuRes = await fetch('/api/menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedMenuId,
          restaurantId: selectedRestaurantId,
          name: menuName || 'Untitled Menu',
          templateId: selectedTemplate || 'modern'
        }),
      });

      if (!menuRes.ok) {
        const menuError = await menuRes.json();
        throw new Error(menuError.error || 'Failed to save menu');
      }

      const menuData = await menuRes.json();
      const menuId = menuData.menu.id;

      // Prepare items with proper menu_id
      const itemsToSave = menuItems.map(item => ({
        id: item.id || undefined,
        menu_id: menuId,
        name: item.name,
        description: item.description || '',
        price: parseFloat(item.price) || 0,
        category: item.category || '',
        image_url: item.image_url || '',
        sales_performance: item.sales_performance === '' ? null : item.sales_performance,
        margin_level: item.margin_level === '' ? null : item.margin_level,
        boost_desired: Boolean(item.boost_desired)
      }));

      // Bulk save all menu items
      const itemsRes = await fetch('/api/menuItems/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menuId,
          items: itemsToSave
        }),
      });

      if (!itemsRes.ok) {
        const itemError = await itemsRes.json();
        throw new Error(itemError.error || 'Failed to save menu items');
      }

      // Update local state with the saved data
      setSelectedMenuId(menuId);
      setIsMenuChanged(false);
      
      // Refresh the menus list
      const updatedMenusRes = await fetch(`/api/menus?restaurantId=${selectedRestaurantId}`);
      if (updatedMenusRes.ok) {
        const updatedMenusData = await updatedMenusRes.json();
        setSavedMenus(updatedMenusData.menus || []);
      }

      alert('Menu and items saved successfully!');
    } catch (err) {
      console.error('[saveMenuToDB] Error:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  // -------------------------------------------------------------------------
  // [6] ADD / DELETE ITEMS
  // -------------------------------------------------------------------------
  function addMenuItem() {
    if (!newItemName) return;
    setMenuItems((prev) => [
      ...prev,
      {
        name: newItemName,
        description: newItemDescription,
        price: newItemPrice,
        category: '',
        image_url: '',
        sales_performance: newItemSalesPerformance,
        margin_level: newItemMarginLevel,
        boost_desired: newItemBoostDesired,
      },
    ]);
    // Clear the fields
    setNewItemName('');
    setNewItemDescription('');
    setNewItemPrice('');
    setNewItemSalesPerformance('');
    setNewItemMarginLevel('');
    setNewItemBoostDesired(false);
    setIsMenuChanged(true);

    setShowAddItemForm(false);
  }

  const removeMenuItem = async (index) => {
    try {
      const item = menuItems[index];
      
      // If item has an ID, delete from server first
      if (item.id) {
        const res = await fetch(`/api/menu-items/${item.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Failed to delete: ${errorText}`);
        }
      }

      // Update local state
      setMenuItems(prev => prev.filter((_, idx) => idx !== index));
      setIsMenuChanged(true);
    } catch (error) {
      console.error('Error removing item:', error);
      alert(`Failed to delete item: ${error.message}`);
    }
  };

  function updateMenuItem(index, field, value) {
    setMenuItems((prev) => {
      const updated = [...prev];
      // For margin_level, ensure empty string is converted to null
      if (field === 'margin_level') {
        updated[index] = { 
          ...updated[index], 
          [field]: value === '' ? null : value 
        };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
    setIsMenuChanged(true);
  }

  // -------------------------------------------------------------------------
  // [7] BULK UPLOAD
  // -------------------------------------------------------------------------
  function handleBulkUpload(items) {
    setMenuItems((prev) => [...prev, ...items]);
    setIsMenuChanged(true);
  }

  // -------------------------------------------------------------------------
  // [8] AI-DRIVEN ENHANCEMENTS
  // -------------------------------------------------------------------------
  async function enhanceItemDescription(item, index) {
    try {
      const res = await fetch('/api/ai/enhanceDescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: item.name,
          oldDescription: item.description,
          brandVoice,
          styleWanted,
          tone,
        }),
      });
      if (!res.ok) throw new Error('Failed to enhance description');

      const data = await res.json();
      const newDesc = data.newDescription;

      const userAccepted = confirm(
        `Original:\n${item.description}\n\nProposed:\n${newDesc}\n\nAccept new description?`
      );
      if (userAccepted) {
        updateMenuItem(index, 'description', newDesc);
      }
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  }

  async function generateImageForItem(item, index) {
    setGeneratingImages((prev) => ({ ...prev, [index]: true }));
    try {
      const imageUrl = await generateImage(
        item.name,
        brandVoice,
        styleWanted,
        tone
      );

      if (imageUrl.error) {
        throw new Error(imageUrl.message);
      }

      updateMenuItem(index, 'image_url', imageUrl);
      toast.success('Image generated successfully! Remember to Save Menu to persist changes.');
    } catch (err) {
      console.error('Image generation error:', err);
      toast.error(err.message);
    } finally {
      setGeneratingImages((prev) => ({ ...prev, [index]: false }));
    }
  }

  function handleRemoveImage(index) {
    const yes = confirm('Are you sure you want to remove this image?');
    if (!yes) return;
    updateMenuItem(index, 'image_url', '');
    alert("Image removed. Don't forget to click Save Menu!");
  }

  function enlargeImage(imageUrl) {
    setEnlargedImageUrl(imageUrl);
  }

  function closeEnlargedImage() {
    setEnlargedImageUrl(null);
  }

  // -------------------------------------------------------------------------
  // [9] DELETING THE ENTIRE SELECTED MENU
  // -------------------------------------------------------------------------
  async function deleteMenuFromDB() {
    if (!selectedMenuId) {
      alert('No menu selected to delete.');
      return;
    }
    const yes = confirm(
      'Are you sure you want to DELETE this menu? This action cannot be undone.'
    );
    if (!yes) return;
    try {
      const res = await fetch(`/api/menus/${selectedMenuId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Failed to delete menu');
      }
      setSavedMenus((prev) => prev.filter((m) => m.id !== selectedMenuId));
      setSelectedMenuId(null);
      setMenuName('');
      setMenuItems([]);
      setIsMenuChanged(false);
      alert('Menu deleted!');
    } catch (error) {
      console.error('Error deleting menu:', error);
      alert('Failed to delete menu');
    }
  }

  // [9A] Export Logic
  const handleExport = (format) => {
    const exportData = menuItems.map((item) => ({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      image_url: item.image_url,
      sales_performance: item.sales_performance,
      margin_level: item.margin_level,
      boost_desired: item.boost_desired,
    }));

    const data =
      format === 'json'
        ? JSON.stringify(exportData, null, 2)
        : convertToCSV(exportData);

    const blob = new Blob([data], {
      type: format === 'json' ? 'application/json' : 'text/csv',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `menu-export.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const convertToCSV = (items) => {
    const header = [
      'name',
      'description',
      'price',
      'category',
      'image_url',
      'sales_performance',
      'margin_level',
      'boost_desired',
    ];
    const rows = items.map((item) =>
      header.map((key) => JSON.stringify(item[key] || '')).join(',')
    );
    return [header.join(','), ...rows].join('\n');
  };

  // -------------------------------------------------------------------------
  // [10] Inline-Edit Helpers
  // -------------------------------------------------------------------------
  function handleEditRow(index) {
    setEditingIndex(index);
    setEditItemData({ ...menuItems[index] });
  }

  function handleCancelEdit() {
    if (editingIndex > -1) {
      const oldData = editItemData;
      setMenuItems((prev) => {
        const updated = [...prev];
        updated[editingIndex] = oldData;
        return updated;
      });
    }
    setEditingIndex(-1);
    setEditItemData({});
  }

  function handleSaveEdit() {
    setIsMenuChanged(true);
    setEditingIndex(-1);
    setEditItemData({});
  }

  // -------------------------------------------------------------------------
  // [11] RENDER
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* "Go Back" Link */}
        <a
          href="/"
          className="text-purple-600 hover:text-purple-700 flex items-center gap-2 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </a>

        {/* Page Title and Intro */}
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Create your Restaurant Menu
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Design and manage your menu items with ease
        </p>

        {/* 
          [A] Single Container Spanning Full Width:
          1) "Menu Management" + Tips
          2) "Review your Menu and enhance it with AI"
        */}
        <div className="bg-white rounded-lg p-6">
          {/* 1) "Menu Management" + Tips & Best Practices */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Menu Management
            </h3>
            <p className="text-gray-700 mb-6">
              Create and manage your menu items, categories, and pricing all in one place.
            </p>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Tips & Best Practices
            </h3>
            <ul className="list-disc list-inside text-gray-700">
              <li>Keep descriptions clear and appetizing</li>
              <li>Update prices and categories regularly</li>
              <li>Add high-quality images when possible</li>
              <li>Group similar items together</li>
            </ul>
          </div>

          {/* 2) "Review your Menu and enhance it with AI" + Menus */}
          <div className="border-b w-full p-4">
            <div className="mb-4">
              <h1 className="text-xl font-medium text-gray-800">
                Review your Menu and enhance it with AI
              </h1>
              <p className="text-sm text-gray-500">
                Manage your items, review their performance, and enhance images
                and descriptions with AI
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Search */}
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-4 border border-gray-200 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700 text-lg"
              />

              {/* Select Restaurant */}
              <select
                className="w-full p-4 border border-gray-200 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700 text-lg"
                value={selectedRestaurantId || ''}
                onChange={(e) =>
                  handleRestaurantSelect(
                    e.target.value ? Number(e.target.value) : null
                  )
                }
              >
                <option value="">Select Restaurant</option>
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>

              {/* Select or Create Menu */}
              <select
                className="w-full p-4 border border-gray-200 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700 text-lg"
                value={selectedMenuId || ''}
                onChange={(e) =>
                  handleMenuSelect(e.target.value ? Number(e.target.value) : null)
                }
              >
                <option value="">Select or Create Menu</option>
                {savedMenus.map((menu) => (
                  <option key={menu.id} value={menu.id}>
                    {menu.name}
                  </option>
                ))}
              </select>

              {/* Delete Menu button (shown only if a menu is selected) */}
              {selectedMenuId && (
                <button
                  onClick={deleteMenuFromDB}
                  className="flex items-center gap-1 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Menu
                </button>
              )}

              {/* Import/Export */}
              <button
                onClick={() => setShowImportExport(true)}
                className="p-2 border rounded-lg text-gray-600 hover:bg-gray-100"
              >
                Import Menu
              </button>

              {/* More Filters */}
              <button className="p-2 border rounded-lg text-gray-600 hover:bg-gray-100">
                More Filters
              </button>
            </div>
          </div>

          {/* AI Settings */}
          <div className="mb-6 p-4">
            <button
              onClick={() => setShowAiSettings(!showAiSettings)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
            >
              {showAiSettings ? 'Hide AI Settings' : 'Show AI Settings'}
            </button>

            {showAiSettings && (
              <div className="mt-4 space-y-4">
                <h2 className="text-lg font-medium text-gray-800">
                  AI Settings
                </h2>
                {/* Brand Voice */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand Voice
                  </label>
                  <input
                    type="text"
                    value={brandVoice}
                    onChange={(e) => setBrandVoice(e.target.value)}
                    placeholder="e.g. upscale, fun, quirky..."
                    className="w-full p-4 border border-gray-200 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700 text-lg"
                  />
                </div>
                {/* Desired Style */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Desired Style
                  </label>
                  <select
                    value={styleWanted}
                    onChange={(e) => setStyleWanted(e.target.value)}
                    className="w-full p-4 border border-gray-200 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700 text-lg"
                  >
                    <option value="modern">Modern</option>
                    <option value="classic">Classic</option>
                    <option value="rustic">Rustic</option>
                  </select>
                </div>
                {/* Tone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tone
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full p-4 border border-gray-200 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700 text-lg"
                  >
                    <option value="friendly">Friendly</option>
                    <option value="quirky">Quirky</option>
                    <option value="serious">Serious</option>
                    <option value="funny">Funny</option>
                    <option value="romantic">Romantic</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* If no menu selected => new menu => show input for Menu Name */}
          {selectedMenuId === null && (
            <div className="mb-6 p-4 bg-gray-50">
              <h2 className="text-md font-semibold text-gray-800 mb-2">
                New Menu Name
              </h2>
              <input
                type="text"
                placeholder="Enter menu name..."
                value={menuName}
                onChange={(e) => {
                  setMenuName(e.target.value);
                  setIsMenuChanged(true);
                }}
                className="w-full p-4 border border-gray-200 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700 text-lg"
              />
            </div>
          )}

          {/* MENU ITEMS TABLE */}
          <div className="p-4 bg-gray-50">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Menu Items</h2>

            {/* + Add Item Button */}
            <div className="mb-4">
              <button
                onClick={() => setShowAddItemForm(!showAddItemForm)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-500"
              >
                {showAddItemForm ? '- Cancel Adding Item' : '+ Add Item'}
              </button>
            </div>

            {/* Collapsible Add Item Form */}
            {showAddItemForm && (
              <div className="rounded-md p-4 mb-8 bg-white shadow-sm">
                <h3 className="text-md font-semibold mb-3">Add New Item</h3>

                <div className="space-y-4">
                  {/* Row 1: Name & Price */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Item Name"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      className="w-full p-4 border border-gray-200 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700 text-lg"
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(e.target.value)}
                      className="w-full p-4 border border-gray-200 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700 text-lg"
                    />
                  </div>
                  {/* Row 2: Description */}
                  <textarea
                    placeholder="Description"
                    value={newItemDescription}
                    onChange={(e) => setNewItemDescription(e.target.value)}
                    className="w-full p-4 border border-gray-200 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700 text-lg"
                    rows={2}
                  />
                  {/* Row 3: Performance, Margin, Boost */}
                  <div className="grid grid-cols-3 gap-4">
                    <select
                      value={newItemSalesPerformance}
                      onChange={(e) => setNewItemSalesPerformance(e.target.value)}
                      className="w-full p-4 border border-gray-200 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700 text-lg"
                    >
                      <option value="">Select Performance</option>
                      <option value="best_seller">Best Seller</option>
                      <option value="regular_seller">Regular Seller</option>
                      <option value="not_selling">Not Selling</option>
                    </select>
                    <select
                      value={newItemMarginLevel}
                      onChange={(e) => setNewItemMarginLevel(e.target.value)}
                      className="w-full p-4 border border-gray-200 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700 text-lg"
                    >
                      <option value="">Select Margin</option>
                      <option value="high_margin">High Margin</option>
                      <option value="mid_margin">Mid Margin</option>
                      <option value="low_margin">Low Margin</option>
                      <option value="red_margin">Red Margin</option>
                    </select>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newItemBoostDesired}
                        onChange={(e) => setNewItemBoostDesired(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600"
                      />
                      <label className="text-sm text-gray-700">
                        Want to Boost?
                      </label>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end mt-4 gap-2">
                  <button
                    onClick={() => setShowAddItemForm(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addMenuItem}
                    className="px-4 py-2 bg-[#FF7A5C] text-white rounded-md hover:bg-[#ff6647]"
                  >
                    Add Item
                  </button>
                </div>
              </div>
            )}

            {/* Items List */}
            <div className="overflow-x-auto bg-white shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Margin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Boost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Image
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {menuItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-12 w-12 mb-4 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                            />
                          </svg>
                          <p className="text-lg font-medium mb-1">
                            No menu items yet
                          </p>
                          <p className="text-sm">
                            Select a menu or create a new one to get started
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    menuItems.map((item, idx) => {
                      const isEditing = idx === editingIndex;
                      return (
                        <tr
                          key={item.id ?? idx}
                          className="hover:bg-gray-50"
                        >
                          {/* NAME */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {isEditing ? (
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) =>
                                  updateMenuItem(idx, 'name', e.target.value)
                                }
                                className="w-full p-4 border border-gray-200 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700 text-lg"
                              />
                            ) : (
                              item.name
                            )}
                          </td>

                          {/* DESCRIPTION */}
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                            {isEditing ? (
                              <textarea
                                value={item.description}
                                onChange={(e) =>
                                  updateMenuItem(idx, 'description', e.target.value)
                                }
                                className="w-full p-4 border border-gray-200 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700 text-lg"
                                rows={2}
                              />
                            ) : (
                              <span className="truncate block">
                                {item.description}
                              </span>
                            )}
                          </td>

                          {/* PRICE */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {isEditing ? (
                              <input
                                type="number"
                                value={item.price}
                                onChange={(e) =>
                                  updateMenuItem(idx, 'price', e.target.value)
                                }
                                className="w-full p-4 border border-gray-200 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700 text-lg"
                              />
                            ) : (
                              `$${item.price}`
                            )}
                          </td>

                          {/* CATEGORY */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {isEditing ? (
                              <input
                                type="text"
                                value={item.category || ''}
                                onChange={(e) =>
                                  updateMenuItem(idx, 'category', e.target.value)
                                }
                                className="w-full p-4 border border-gray-200 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700 text-lg"
                              />
                            ) : (
                              item.category
                            )}
                          </td>

                          {/* PERFORMANCE */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isEditing ? (
                              <select
                                value={item.sales_performance || ''}
                                onChange={(e) =>
                                  updateMenuItem(
                                    idx,
                                    'sales_performance',
                                    e.target.value
                                  )
                                }
                                className="w-full p-4 border border-gray-200 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700 text-lg"
                              >
                                <option value="">Not Set</option>
                                <option value="best_seller">Best Seller</option>
                                <option value="regular_seller">
                                  Regular Seller
                                </option>
                                <option value="not_selling">Not Selling</option>
                              </select>
                            ) : (
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  item.sales_performance === 'best_seller'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {item.sales_performance || 'Not Set'}
                              </span>
                            )}
                          </td>

                          {/* MARGIN */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isEditing ? (
                              <select
                                value={item.margin_level || ''}
                                onChange={(e) =>
                                  updateMenuItem(idx, 'margin_level', e.target.value)
                                }
                                className="w-full p-4 border border-gray-200 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700 text-lg"
                              >
                                <option value="">Not Set</option>
                                <option value="high_margin">High Margin</option>
                                <option value="mid_margin">Mid Margin</option>
                                <option value="low_margin">Low Margin</option>
                                <option value="red_margin">Red Margin</option>
                              </select>
                            ) : (
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  item.margin_level === 'high_margin'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {item.margin_level || 'Not Set'}
                              </span>
                            )}
                          </td>

                          {/* BOOST */}
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {isEditing ? (
                              <input
                                type="checkbox"
                                checked={item.boost_desired}
                                onChange={(e) =>
                                  updateMenuItem(
                                    idx,
                                    'boost_desired',
                                    e.target.checked
                                  )
                                }
                              />
                            ) : (
                              <input
                                type="checkbox"
                                checked={item.boost_desired}
                                disabled
                              />
                            )}
                          </td>

                          {/* IMAGE */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {item.image_url ? (
                              <div className="flex items-center space-x-2">
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  className="h-8 w-8 rounded-full cursor-pointer hover:opacity-80"
                                  onClick={() => enlargeImage(item.image_url)}
                                />
                                {!isEditing && (
                                  <button
                                    onClick={() => handleRemoveImage(idx)}
                                    className="text-red-600 hover:text-red-800 text-sm"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            ) : isEditing ? (
                              <span className="text-xs text-gray-400">
                                (Generate or leave empty)
                              </span>
                            ) : (
                              <button
                                onClick={() => generateImageForItem(item, idx)}
                                disabled={generatingImages[idx]}
                                className={`text-sm ${
                                  generatingImages[idx]
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-blue-600 hover:text-blue-800'
                                }`}
                              >
                                {generatingImages[idx] ? (
                                  <span className="flex items-center gap-1">
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    Generating...
                                  </span>
                                ) : (
                                  'Generate'
                                )}
                              </button>
                            )}
                          </td>

                          {/* ACTIONS */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex space-x-2">
                              {isEditing ? (
                                <>
                                  {/* Save Button */}
                                  <button
                                    onClick={handleSaveEdit}
                                    className="text-green-600 hover:text-green-800 flex items-center"
                                  >
                                    <Check className="w-4 h-4 mr-1" />
                                    Save
                                  </button>
                                  {/* Cancel Button */}
                                  <button
                                    onClick={handleCancelEdit}
                                    className="text-red-600 hover:text-red-800 flex items-center"
                                  >
                                    <X className="w-4 h-4 mr-1" />
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  {/* Edit Icon */}
                                  <button
                                    onClick={() => handleEditRow(idx)}
                                    className="text-blue-600 hover:text-blue-800 flex items-center"
                                  >
                                    <Edit2 className="w-4 h-4 mr-1" />
                                    Edit
                                  </button>
                                  {/* Enhance Button */}
                                  <button
                                    onClick={() => enhanceItemDescription(item, idx)}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    Enhance
                                  </button>
                                  {/* Delete Button */}
                                  <button
                                    onClick={() => removeMenuItem(idx)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Preview & Save Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <button
                onClick={() => setShowPreview(true)}
                className="flex items-center justify-center sm:flex-1 py-2 border border-[#FF7A5C] text-[#FF7A5C] rounded-md hover:bg-[#FF7A5C] hover:text-white transition-colors"
              >
                <Eye className="w-5 h-5 mr-2" />
                Preview Menu
              </button>

              {isMenuChanged && menuItems.length > 0 && (
                <button
                  onClick={saveMenuToDB}
                  disabled={!selectedRestaurantId || !menuName || isLoading}
                  className="flex items-center justify-center sm:flex-1 bg-[#FF7A5C] text-white py-2 rounded-md hover:bg-[#ff6647] disabled:opacity-50 transition-colors"
                >
                  {isLoading
                    ? 'Saving...'
                    : selectedMenuId
                    ? 'Save Changes'
                    : 'Create Menu'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* [C] PREVIEW MODAL (border removed) */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white w-full h-auto p-6 rounded shadow-lg relative">
            <MenuPreview
              items={menuItems}
              template={selectedTemplate}
              menuName={menuName}
              onClose={() => setShowPreview(false)}
            />
          </div>
        </div>
      )}

      {/* [D] ENLARGED IMAGE MODAL */}
      {enlargedImageUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="relative max-w-md mx-auto">
            <img
              src={enlargedImageUrl}
              alt="Enlarged dish"
              className="rounded-lg shadow-lg"
            />
            <button
              onClick={closeEnlargedImage}
              className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition-all"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* [E] Import/Export Modal (border removed) */}
      <ImportExportModal
        isOpen={showImportExport}
        onClose={() => setShowImportExport(false)}
        onImport={handleBulkUpload}
        onExport={handleExport}
      />
    </div>
  );
}