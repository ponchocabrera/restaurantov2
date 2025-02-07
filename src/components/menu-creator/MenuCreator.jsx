'use client';

import React, { useState, useEffect } from 'react';
import {
  Eye,
  Trash2,
  Minimize2,
  Edit2,
  Check,
  X,
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

  // Search
  const [searchTerm, setSearchTerm] = useState('');

  // Inline editing (only once!)
  const [editingIndex, setEditingIndex] = useState(-1);
  const [editItemData, setEditItemData] = useState({});

  // Success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // -------------------------------------------------------------------------
  // [1A] FILTERED MENU ITEMS
  // -------------------------------------------------------------------------
  const filteredMenuItems = menuItems.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.name?.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower) ||
      item.category?.toLowerCase().includes(searchLower) ||
      item.price?.toString().includes(searchLower)
    );
  });

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
    const numericId = restaurantId ? Number(restaurantId) : null;
    setSelectedRestaurantId(numericId);
    setSavedMenus([]);
    setSelectedMenuId(null);
    setMenuName('');
    setMenuItems([]);
    setIsMenuChanged(false);

    if (!numericId) return;

    try {
      const res = await fetch(`/api/menus?restaurantId=${numericId}`);
      if (!res.ok) throw new Error('Failed to fetch menus');
      const data = await res.json();
      setSavedMenus(data.menus || []);
    } catch (err) {
      console.error('Error fetching menus:', err);
      toast.error('Failed to load menus');
    }
  };

  // -------------------------------------------------------------------------
  // [4] SELECTING OR CREATING A MENU
  // -------------------------------------------------------------------------
  const handleMenuSelect = async (menuId) => {
    const numericId = menuId ? Number(menuId) : null;
    
    if (!numericId) {
      // Means user wants to create a new menu
      setSelectedMenuId(null);
      setMenuName('');
      setSelectedTemplate('modern');
      setMenuItems([]);
      setIsMenuChanged(false);
      return;
    }

    try {
      setIsLoading(true);
      const existingMenu = savedMenus.find((m) => m.id === numericId);
      if (existingMenu) {
        setSelectedMenuId(numericId);
        setMenuName(existingMenu.name);
        setSelectedTemplate(existingMenu.template_id || 'modern');
        await fetchMenuItems(numericId);
        setIsMenuChanged(false);
      }
    } catch (error) {
      console.error('Error selecting menu:', error);
      toast.error('Failed to load menu');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch items for the chosen menu
  async function fetchMenuItems(menuId) {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/menuItems?menuId=${menuId}`);
      if (!res.ok) throw new Error('Failed to fetch menu items');
      const data = await res.json();

      const items = data.items || data.menuItems || [];
      setMenuItems(
        items.map((item) => ({
          id: item.id,
          name: item.name || '',
          description: item.description || '',
          price: item.price || '',
          category: item.category || '',
          image_url: item.image_url || '',
          sales_performance: item.sales_performance || '',
          margin_level: item.margin_level || '',
          boost_desired: Boolean(item.boost_desired),
        }))
      );
    } catch (err) {
      console.error('Error fetching menu items:', err);
      toast.error('Failed to load menu items');
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
        toast.error('Please select a restaurant first!');
        return;
      }
      setIsLoading(true);

      // Save menu first
      const menuEndpoint = selectedMenuId
        ? `/api/menus/${selectedMenuId}`
        : '/api/menus';
      const menuRes = await fetch(menuEndpoint, {
        method: selectedMenuId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: selectedRestaurantId,
          name: menuName || 'Untitled Menu',
          templateId: selectedTemplate || 'modern'
        }),
      });

      if (!menuRes.ok) {
        const errorText = await menuRes.text();
        const errorData = errorText ? JSON.parse(errorText) : { error: 'Unknown error' };
        throw new Error(errorData.error || 'Failed to save menu');
      }

      const menuData = await menuRes.json();
      const menuId = menuData.menu.id;

      // Save menu items via bulk
      const bulkRes = await fetch('/api/menuItems/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menuId: menuId,
          items: menuItems
        }),
      });

      if (!bulkRes.ok) {
        const errorText = await bulkRes.text();
        const errorData = errorText ? JSON.parse(errorText) : { error: 'Unknown error' };
        throw new Error(errorData.error || 'Failed to save menu items');
      }

      // Update local
      setSelectedMenuId(menuId);
      setMenuName(menuData.menu.name);
      setIsMenuChanged(false);
      
      // Refresh the menus list
      const updatedMenusRes = await fetch(`/api/menus?restaurantId=${selectedRestaurantId}`);
      if (updatedMenusRes.ok) {
        const updatedMenusData = await updatedMenusRes.json();
        setSavedMenus(updatedMenusData.menus || []);
      }

      setShowSuccessModal(true);
    } catch (err) {
      console.error('[saveMenuToDB] Error:', err);
      toast.error(`Error: ${err.message}`);
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
    // Clear
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
      // If item has an ID, delete from server
      if (item.id) {
        const res = await fetch(`/api/menu-items/${item.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          }
        });
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Failed to delete: ${errorText}`);
        }
      }
      // Remove locally
      setMenuItems((prev) => prev.filter((_, idx) => idx !== index));
      setIsMenuChanged(true);
    } catch (error) {
      console.error('Error removing item:', error);
      alert(`Failed to delete item: ${error.message}`);
    }
  };

  function updateMenuItem(index, field, value) {
    setMenuItems((prev) => {
      const updated = [...prev];
      if (field === 'margin_level') {
        // Convert empty to null
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
  // [8] AI ENHANCEMENTS
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
      toast.success('Image generated successfully! Don’t forget to save.');
    } catch (err) {
      console.error('Image generation error:', err);
      toast.error(err.message);
    } finally {
      setGeneratingImages((prev) => ({ ...prev, [index]: false }));
    }
  }

  function handleRemoveImage(index) {
    if (!confirm('Remove this image?')) return;
    updateMenuItem(index, 'image_url', '');
    alert('Image removed. Remember to save!');
  }

  function enlargeImage(url) {
    setEnlargedImageUrl(url);
  }
  function closeEnlargedImage() {
    setEnlargedImageUrl(null);
  }

  // -------------------------------------------------------------------------
  // [9] DELETE ENTIRE MENU
  // -------------------------------------------------------------------------
  async function deleteMenuFromDB() {
    if (!selectedMenuId) {
      alert('No menu selected to delete.');
      return;
    }
    if (!confirm('Are you sure you want to DELETE this menu?')) return;
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

  // -------------------------------------------------------------------------
  // [9A] IMPORT/EXPORT
  // -------------------------------------------------------------------------
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
  // [10] INLINE EDIT
  // -------------------------------------------------------------------------
  function handleEditRow(index) {
    setEditingIndex(index);
    setEditItemData({ ...menuItems[index] });
  }

  function handleCancelEdit() {
    // revert changes
    if (editingIndex > -1) {
      setMenuItems((prev) => {
        const updated = [...prev];
        updated[editingIndex] = editItemData;
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
  // [11] RENDER (styled to match the screenshot)
  // -------------------------------------------------------------------------
  return (
    <div className="w-full min-h-screen bg-[#ffffff] text-[#333]">
      {/* Title Block */}
      <div className="max-w-screen-xl mx-auto pt-8 px-4">
        <h1 className="text-5xl font-bold font-libre text-gray-900 mb-1">
          Create and Enhance Menu Items Images and Descriptions
        </h1>
        <h2 className="text-2xl outfit-bold text-gray-800 mb-2">
          Menu Enhancement
        </h2>
        <p className="text-lg font-work-sans text-gray-600 mb-8">
          Design and Manage your Menu with Ease. Add your Menu, and let the AI do the rest.
        </p>

        {/* First row of selects: Restaurant, Menu, If new => input */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          {/* Select a Restaurant */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              Select a Restaurant
            </label>
            <select
              value={selectedRestaurantId || ''}
              onChange={(e) => handleRestaurantSelect(e.target.value)}
              className="p-3 border border-gray-200 rounded focus:outline-none bg-white"
            >
              <option value="" disabled>
                Select a Restaurant
              </option>
              {restaurants.map((rest) => (
                <option key={rest.id} value={rest.id}>
                  {rest.name}
                </option>
              ))}
            </select>
          </div>

          {/* Select or Create a Menu */}
          {selectedRestaurantId && (
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                Select or Create a Menu
              </label>
              <select
                value={selectedMenuId || ''}
                onChange={(e) => handleMenuSelect(e.target.value)}
                className="p-3 border border-gray-200 rounded focus:outline-none bg-white"
              >
                <option value="" disabled>
                  Create a new menu or pick an existing one
                </option>
                {savedMenus.map((menu) => (
                  <option key={menu.id} value={menu.id}>
                    {menu.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* If new menu => text input */}
          {selectedRestaurantId && selectedMenuId === null && (
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                If New Menu: Add Menu Name Here
              </label>
              <input
                type="text"
                placeholder="Type new menu name..."
                value={menuName}
                onChange={(e) => {
                  setMenuName(e.target.value);
                  setIsMenuChanged(true);
                }}
                className="p-3 border border-gray-200 rounded focus:outline-none bg-white"
              />
            </div>
          )}
        </div>

        {/* Buttons row: Add Item, Import, AI Settings, Delete (if any), etc. */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button
            onClick={() => setShowAddItemForm(!showAddItemForm)}
            className="bg-[#212350] text-white px-5 py-2 rounded-full font-work-sans hover:bg-[#322fc1]"
          >
            Add Item
          </button>

          <button
            onClick={() => setShowImportExport(true)}
            className="px-5 py-2 border border-gray-300 rounded-full hover:bg-gray-50 text-sm font-medium"
          >
            Import Menu
          </button>

          {selectedMenuId && (
            <button
              onClick={deleteMenuFromDB}
              className="flex items-center gap-1 text-red-600 hover:text-red-700 text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" />
              Delete Menu
            </button>
          )}

          <button
            onClick={() => setShowAiSettings(!showAiSettings)}
            className="px-5 py-2 border border-gray-300 rounded-full hover:bg-gray-50 text-sm font-medium"
          >
            AI Settings
          </button>
        </div>

        {/* AI Settings (toggles open) */}
        {showAiSettings && (
          <div className="p-4 mb-6 rounded bg-white shadow">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              AI Settings
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Brand Voice */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Brand Voice
                </label>
                <input
                  type="text"
                  value={brandVoice}
                  onChange={(e) => setBrandVoice(e.target.value)}
                  placeholder="e.g. upscale, fun, quirky..."
                  className="p-3 border border-gray-200 rounded"
                />
              </div>
              {/* Style Wanted */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Desired Style
                </label>
                <select
                  value={styleWanted}
                  onChange={(e) => setStyleWanted(e.target.value)}
                  className="p-3 border border-gray-200 rounded"
                >
                  <option value="modern">Modern</option>
                  <option value="classic">Classic</option>
                  <option value="rustic">Rustic</option>
                </select>
              </div>
              {/* Tone */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="p-3 border border-gray-200 rounded"
                >
                  <option value="friendly">Friendly</option>
                  <option value="quirky">Quirky</option>
                  <option value="serious">Serious</option>
                  <option value="funny">Funny</option>
                  <option value="romantic">Romantic</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Add Item Form (collapsible) */}
        {showAddItemForm && (
          <div className="p-4 mb-6 bg-white shadow rounded">
            <h3 className="text-md font-semibold mb-3">Add New Item</h3>
            <div className="space-y-4">
              {/* Row 1: Name & Price */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Item Name"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="p-3 border border-gray-200 rounded"
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  className="p-3 border border-gray-200 rounded"
                />
              </div>
              {/* Row 2: Description */}
              <textarea
                placeholder="Description"
                value={newItemDescription}
                onChange={(e) => setNewItemDescription(e.target.value)}
                rows={2}
                className="p-3 border border-gray-200 rounded w-full"
              />
              {/* Row 3: Performance, Margin, Boost */}
              <div className="grid grid-cols-3 gap-4">
                <select
                  value={newItemSalesPerformance}
                  onChange={(e) => setNewItemSalesPerformance(e.target.value)}
                  className="p-3 border border-gray-200 rounded"
                >
                  <option value="">Select Performance</option>
                  <option value="best_seller">Best Seller</option>
                  <option value="regular_seller">Regular Seller</option>
                  <option value="not_selling">Not Selling</option>
                </select>
                <select
                  value={newItemMarginLevel}
                  onChange={(e) => setNewItemMarginLevel(e.target.value)}
                  className="p-3 border border-gray-200 rounded"
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
                    className="w-4 h-4"
                  />
                  <label className="text-sm text-gray-700">
                    Want to Boost?
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-4 gap-2">
              <button
                onClick={() => setShowAddItemForm(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={addMenuItem}
                className="px-4 py-2 bg-[#3b3ace] text-white rounded font-medium hover:bg-[#322fc1]"
              >
                Add Item
              </button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-3 border border-gray-200 rounded w-full"
          />
        </div>

        {/* TABLE */}
        <div className="bg-white shadow rounded overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#f8f8f8] text-[#666] uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-left">Price</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Performance</th>
                <th className="px-4 py-3 text-left">Margin</th>
                <th className="px-4 py-3 text-left">Boost</th>
                <th className="px-4 py-3 text-left">Image</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {filteredMenuItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-gray-500">
                    No items to show. Add some or select a menu.
                  </td>
                </tr>
              ) : (
                filteredMenuItems.map((item, idx) => {
                  const isEditing = editingIndex === idx;
                  return (
                    <tr key={item.id ?? idx} className="hover:bg-gray-50">
                      {/* Name */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {item.name}
                      </td>
                      {/* Description */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {item.description}
                      </td>
                      {/* Price */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) =>
                              updateMenuItem(idx, 'price', e.target.value)
                            }
                            className="w-20 p-1 border border-gray-200 rounded"
                          />
                        ) : (
                          `$${item.price}`
                        )}
                      </td>
                      {/* Category */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="text"
                            value={item.category || ''}
                            onChange={(e) =>
                              updateMenuItem(idx, 'category', e.target.value)
                            }
                            className="p-1 border border-gray-200 rounded w-28"
                          />
                        ) : (
                          item.category
                        )}
                      </td>
                      {/* Performance */}
                      <td className="px-4 py-3 whitespace-nowrap">
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
                            className="p-1 border border-gray-200 rounded"
                          >
                            <option value="">Not Set</option>
                            <option value="best_seller">Best Seller</option>
                            <option value="regular_seller">Regular Seller</option>
                            <option value="not_selling">Not Selling</option>
                          </select>
                        ) : item.sales_performance === 'best_seller' ? (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                            Best Seller
                          </span>
                        ) : item.sales_performance === 'regular_seller' ? (
                          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                            Regular
                          </span>
                        ) : item.sales_performance === 'not_selling' ? (
                          <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs">
                            Not Selling
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">
                            (Not Set)
                          </span>
                        )}
                      </td>
                      {/* Margin */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isEditing ? (
                          <select
                            value={item.margin_level || ''}
                            onChange={(e) =>
                              updateMenuItem(idx, 'margin_level', e.target.value)
                            }
                            className="p-1 border border-gray-200 rounded"
                          >
                            <option value="">Not Set</option>
                            <option value="high_margin">High Margin</option>
                            <option value="mid_margin">Mid Margin</option>
                            <option value="low_margin">Low Margin</option>
                            <option value="red_margin">Red Margin</option>
                          </select>
                        ) : item.margin_level === 'high_margin' ? (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            High Margin
                          </span>
                        ) : item.margin_level === 'mid_margin' ? (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                            Mid Margin
                          </span>
                        ) : item.margin_level === 'low_margin' ? (
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                            Low Margin
                          </span>
                        ) : item.margin_level === 'red_margin' ? (
                          <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs">
                            Red Margin
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">
                            (Not Set)
                          </span>
                        )}
                      </td>
                      {/* Boost */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="checkbox"
                            checked={item.boost_desired}
                            onChange={(e) =>
                              updateMenuItem(idx, 'boost_desired', e.target.checked)
                            }
                          />
                        ) : (
                          // Show a pill: Active (purple) / Inactive (gray)
                          item.boost_desired ? (
                            <span className="inline-block bg-[#E5DEFF] text-[#5B49FF] px-2 py-1 rounded-full text-xs font-medium">
                              Active
                            </span>
                          ) : (
                            <span className="inline-block bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                              Inactive
                            </span>
                          )
                        )}
                      </td>
                      {/* Image */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {item.image_url ? (
                          <div className="flex items-center gap-1">
                            <img
                              src={item.image_url}
                              alt="Item"
                              className="h-8 w-8 rounded-full cursor-pointer"
                              onClick={() => enlargeImage(item.image_url)}
                            />
                            {/* Remove button if not editing in-line */}
                            {!isEditing && (
                              <button
                                onClick={() => handleRemoveImage(idx)}
                                className="text-red-600 text-xs hover:underline"
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
                      {/* Actions */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex gap-2 items-center">
                          {isEditing ? (
                            <>
                              <button
                                onClick={handleSaveEdit}
                                className="text-green-600 hover:text-green-800 flex items-center gap-1"
                              >
                                <Check className="w-4 h-4" />
                                <span className="text-xs">Save</span>
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="text-red-600 hover:text-red-800 flex items-center gap-1"
                              >
                                <X className="w-4 h-4" />
                                <span className="text-xs">Cancel</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditRow(idx)}
                                className="text-[#5B49FF] hover:text-[#3b3ace] flex items-center gap-1"
                              >
                                <Edit2 className="w-4 h-4" />
                                <span className="text-xs">Edit</span>
                              </button>
                              <button
                                onClick={() => enhanceItemDescription(item, idx)}
                                className="text-[#5B49FF] hover:text-[#3b3ace] flex items-center gap-1 text-xs"
                              >
                                Enhance
                              </button>
                              <button
                                onClick={() => removeMenuItem(idx)}
                                className="text-red-600 hover:text-red-800 flex items-center gap-1"
                              >
                                <Trash2 className="w-4 h-4" />
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

        {/* Preview & Save row */}
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center justify-center px-4 py-2 border border-[#5B49FF] text-[#5B49FF] rounded-full hover:bg-[#5B49FF] hover:text-white"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview Menu
          </button>
          {isMenuChanged && filteredMenuItems.length > 0 && (
            <button
              onClick={saveMenuToDB}
              disabled={!selectedRestaurantId || isLoading}
              className={`flex items-center justify-center px-4 py-2 rounded text-white ${
                isLoading
                  ? 'bg-opacity-70'
                  : 'bg-[#5B49FF] hover:bg-[#3b3ace]'
              }`}
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

      {/* PREVIEW MODAL */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded relative shadow-lg">
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
            <MenuPreview
              items={filteredMenuItems}
              template={selectedTemplate}
              menuName={menuName}
              onClose={() => setShowPreview(false)}
            />
          </div>
        </div>
      )}

      {/* ENLARGED IMAGE MODAL */}
      {enlargedImageUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-md mx-auto">
            <img
              src={enlargedImageUrl}
              alt="Enlarged dish"
              className="rounded shadow-lg w-full"
            />
            <button
              onClick={closeEnlargedImage}
              className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* IMPORT/EXPORT MODAL */}
      <ImportExportModal
        isOpen={showImportExport}
        onClose={() => setShowImportExport(false)}
        onImport={handleBulkUpload}
        onExport={handleExport}
      />

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-xl relative">
            <button
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mt-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Menu Saved Successfully!
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                “{menuName}” has been saved to your restaurant’s menu list.
              </p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full inline-flex justify-center rounded-md border border-transparent px-4 py-2 bg-green-600 text-sm font-medium text-white hover:bg-green-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
