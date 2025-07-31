import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, addDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { ArrowDown, ArrowUp, Plus, Trash2, Edit, X, Wind, Mountain, Briefcase, Bike, ChevronDown, ChevronRight, Weight, Package, Backpack, Tent, Map as MapIcon, Fish, Sailboat, Snowflake, Camera, Plane, Car, Flame, Bed, Star, Search } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- Firebase Configuration ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-gear-tracker';

// --- Firebase Initialization ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- Pre-defined Data ---
const PREDEFINED_GEAR_LISTS = {
  "Trail Running": [
    { name: 'Trail Running Shoes', model: 'e.g., Hoka Speedgoat', category: 'Footwear', weight: 620 },
    { name: 'Running Shorts', category: 'Clothing (Bottoms)', weight: 120 },
    { name: 'Technical T-Shirt', category: 'Clothing (Tops)', weight: 150 },
    { name: 'Running Socks', category: 'Socks', weight: 50 },
    { name: 'Hydration Vest', model: 'e.g., Salomon ADV Skin 12', category: 'Packs', weight: 300 },
    { name: 'Water Bottles/Bladder', category: 'Hydration', weight: 150 },
    { name: 'Energy Gels/Snacks', category: 'Consumables', weight: 30 },
    { name: 'GPS Watch', model: 'e.g., Garmin Forerunner', category: 'Electronics', weight: 50 },
    { name: 'Headlamp', model: 'e.g., Petzl Actik Core', category: 'Electronics', weight: 90 },
    { name: 'Light Rain Jacket', category: 'Clothing (Outerwear)', weight: 250 },
    { name: 'Emergency Whistle', category: 'Safety', weight: 10 },
    { name: 'Small First-Aid Kit', category: 'Safety', weight: 100 },
  ],
  "Road Running": [
    { name: 'Road Running Shoes', category: 'Footwear', weight: 500 },
    { name: 'Running Shorts/Tights', category: 'Clothing (Bottoms)', weight: 150 },
    { name: 'Technical T-Shirt/Singlet', category: 'Clothing (Tops)', weight: 130 },
    { name: 'Running Socks', category: 'Socks', weight: 50 },
    { name: 'GPS Watch', category: 'Electronics', weight: 50 },
    { name: 'Sunscreen', category: 'Consumables', weight: 100 },
    { name: 'Hat/Visor', category: 'Headwear', weight: 60 },
    { name: 'Water Bottle', category: 'Hydration', weight: 80 },
    { name: 'Energy Gels', category: 'Consumables', weight: 30 },
  ],
  "Road Cycling": [
    { name: 'Road Bike', category: 'Cycling', weight: 8000 },
    { name: 'Helmet', category: 'Safety', weight: 250 },
    { name: 'Cycling Jersey', category: 'Clothing (Tops)', weight: 180 },
    { name: 'Bib Shorts', category: 'Clothing (Bottoms)', weight: 200 },
    { name: 'Cycling Shoes', category: 'Footwear', weight: 500 },
    { name: 'Clipless Pedals', category: 'Cycling', weight: 300 },
    { name: 'Water Bottles', category: 'Hydration', weight: 160 },
    { name: 'Bike Computer', category: 'Electronics', weight: 80 },
    { name: 'Tire Levers', category: 'Tools', weight: 40 },
    { name: 'Spare Tube', category: 'Tools', weight: 100 },
    { name: 'Mini Pump/CO2', category: 'Tools', weight: 150 },
    { name: 'Multi-tool', category: 'Tools', weight: 120 },
    { name: 'Snacks', category: 'Consumables', weight: 60 },
  ],
  "Hotel Road Cycle Touring": [
    { name: 'Road Bike', category: 'Cycling', weight: 8000 },
    { name: 'Helmet', category: 'Safety', weight: 250 },
    { name: 'Cycling Jerseys', category: 'Clothing (Tops)', weight: 360 },
    { name: 'Bib Shorts', category: 'Clothing (Bottoms)', weight: 400 },
    { name: 'Cycling Shoes', category: 'Footwear', weight: 500 },
    { name: 'Casual Shoes', category: 'Footwear', weight: 700 },
    { name: 'On-bike Frame Bag/Saddlebag', category: 'Packs', weight: 400 },
    { name: 'Clothing for Evenings', category: 'Clothing', weight: 500 },
    { name: 'Toiletries', category: 'Hygiene', weight: 300 },
    { name: 'Bike Lock', category: 'Safety', weight: 500 },
    { name: 'Portable Charger', category: 'Electronics', weight: 200 },
    { name: 'Chamois Cream', category: 'Consumables', weight: 100 },
    { name: 'Nutrition/Snacks', category: 'Consumables', weight: 300 },
    { name: 'Bike Lights (Front & Rear)', category: 'Electronics', weight: 150 },
  ],
  "Hiking": [
    { name: 'Hiking Boots/Shoes', category: 'Footwear', weight: 1200 },
    { name: 'Daypack', category: 'Packs', weight: 900 },
    { name: 'Water Bottles/Reservoir', category: 'Hydration', weight: 150 },
    { name: 'Water Filter/Purifier', category: 'Hydration', weight: 80 },
    { name: 'Map and Compass/GPS', category: 'Navigation', weight: 100 },
    { name: 'Trekking Poles', category: 'Tools', weight: 500 },
    { name: 'Rain Jacket', category: 'Clothing (Outerwear)', weight: 250 },
    { name: 'Fleece/Insulated Jacket', category: 'Clothing (Outerwear)', weight: 400 },
    { name: 'Hiking Pants/Shorts', category: 'Clothing (Bottoms)', weight: 300 },
    { name: 'Wool Socks', category: 'Socks', weight: 80 },
    { name: 'First-Aid Kit', category: 'Safety', weight: 150 },
    { name: 'Headlamp', category: 'Electronics', weight: 90 },
    { name: 'Sunscreen', category: 'Consumables', weight: 100 },
    { name: 'Hat', category: 'Headwear', weight: 70 },
    { name: 'Snacks/Lunch', category: 'Consumables', weight: 500 },
  ],
  "Onebagging": [
    { name: 'Travel Backpack', category: 'Packs', weight: 1000 },
    { name: 'Packing Cubes', category: 'Organization', weight: 200 },
    { name: 'Merino Wool T-Shirts', category: 'Clothing (Tops)', weight: 450 },
    { name: 'Travel Pants', category: 'Clothing (Bottoms)', weight: 400 },
    { name: 'Shorts', category: 'Clothing (Bottoms)', weight: 200 },
    { name: 'Underwear', category: 'Clothing', weight: 200 },
    { name: 'Socks', category: 'Socks', weight: 200 },
    { name: 'Packable Rain Jacket', category: 'Clothing (Outerwear)', weight: 250 },
    { name: 'Versatile Shoes', category: 'Footwear', weight: 800 },
    { name: 'Toiletry Kit (Solid)', category: 'Hygiene', weight: 250 },
    { name: 'Universal Power Adapter', category: 'Electronics', weight: 150 },
    { name: 'Portable Charger', category: 'Electronics', weight: 200 },
    { name: 'E-reader/Book', category: 'Entertainment', weight: 180 },
    { name: 'Passport/ID', category: 'Essentials', weight: 20 },
    { name: 'Reusable Water Bottle', category: 'Hydration', weight: 150 },
  ],
};

const DEFAULT_GEAR_INVENTORY = [
    { name: 'Travel Backpack', model: 'Osprey Farpoint 40', category: 'Packs', notes: '', weight: 1000, quantity: 1, retired: false },
    { name: 'Daypack', model: 'REI Flash 22', category: 'Packs', notes: '', weight: 400, quantity: 1, retired: false },
    { name: 'Hydration Vest', model: 'Salomon ADV Skin 12', category: 'Packs', notes: '', weight: 300, quantity: 1, retired: false },
    { name: 'Technical T-Shirt', model: '', category: 'Clothing (Tops)', notes: '', weight: 150, quantity: 3, retired: false },
    { name: 'Running Shorts', model: '', category: 'Clothing (Bottoms)', notes: '', weight: 120, quantity: 2, retired: false },
    { name: 'Rain Jacket', model: 'Patagonia Torrentshell 3L', category: 'Clothing (Outerwear)', notes: 'Lightweight and packable', weight: 250, quantity: 1, retired: false },
    { name: 'Fleece/Insulated Jacket', model: 'Arc\'teryx Atom LT', category: 'Clothing (Outerwear)', notes: '', weight: 400, quantity: 1, retired: false },
    { name: 'Hiking Boots/Shoes', model: 'Merrell Moab 3', category: 'Footwear', notes: '', weight: 1200, quantity: 1, retired: false },
    { name: 'Trail Running Shoes', model: 'Saucony Xodus Ultra 4', category: 'Footwear', notes: '', weight: 600, quantity: 1, retired: false },
    { name: 'Headlamp', model: 'Petzl Actik Core', category: 'Electronics', notes: 'With extra batteries', weight: 90, quantity: 1, retired: false },
    { name: 'GPS Watch', model: 'Garmin Fenix 7', category: 'Electronics', notes: '', weight: 60, quantity: 1, retired: false },
    { name: 'GPS Watch', model: 'Garmin Forerunner 255s', category: 'Electronics', notes: '', weight: 49, quantity: 1, retired: false },
    { name: 'First-Aid Kit', model: 'Adventure Medical Kits', category: 'Safety', notes: 'Check supplies regularly', weight: 150, quantity: 1, retired: false },
    { name: 'Water Filter/Purifier', model: 'Sawyer Squeeze', category: 'Hydration', notes: '', weight: 80, quantity: 1, retired: false },
    { name: 'Energy Gels/Snacks', model: 'GU Energy Gels', category: 'Consumables', notes: '', weight: 30, quantity: 5, retired: false },
    { name: 'Sunscreen', model: '', category: 'Consumables', notes: '', weight: 100, quantity: 1, retired: false },
    { name: 'Tent', model: 'Big Agnes Copper Spur HV UL2', category: 'Shelter', notes: '', weight: 1400, quantity: 1, retired: false },
    { name: 'Sleeping Bag', model: 'REI Magma 15', category: 'Sleep System', notes: '', weight: 800, quantity: 1, retired: false },
    { name: 'Sleeping Pad', model: 'Therm-a-Rest NeoAir XLite', category: 'Sleep System', notes: '', weight: 350, quantity: 1, retired: false },
    { name: 'Stove', model: 'MSR PocketRocket 2', category: 'Cooking', notes: '', weight: 73, quantity: 1, retired: false },
    { name: 'Cook Pot', model: 'TOAKS Titanium 750ml Pot', category: 'Cooking', notes: '', weight: 103, quantity: 1, retired: false },
].map(item => ({ ...item, id: crypto.randomUUID() }));

const PREDEFINED_LIST_TITLES = [
    "Weekend Camping Trip",
    "Road Race Day Kit",
    "2 Weeks in Japan",
    "Beach Day Essentials",
    "Ski Trip to Whistler",
    "My Go-Bag",
    "Summer Hiking Gear",
];

// --- Main App Component ---
export default function App() {
  const [userId, setUserId] = useState(null);
  const [gear, setGear] = useState([]);
  const [customLists, setCustomLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [isGearModalOpen, setIsGearModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [editingGear, setEditingGear] = useState(null);
  const [editingList, setEditingList] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Auth & Data Loading Effects ---
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, u => u ? setUserId(u.uid) : signInAnonymously(auth).catch(e => console.error("Auth Error", e)));
    return unsubAuth;
  }, []);

  useEffect(() => {
    if (!userId) return;
    setIsLoading(true);
    const docRef = doc(db, "artifacts", appId, "users", userId);
    const unsubGear = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().gear) {
        setGear(docSnap.data().gear.map(g => ({...g, id: g.id || crypto.randomUUID()})));
      } else {
        handleSaveGear(DEFAULT_GEAR_INVENTORY, userId);
        setGear(DEFAULT_GEAR_INVENTORY);
      }
      setIsLoading(false);
    }, e => { console.error(e); setError("Failed to load gear data."); setIsLoading(false); });

    const listsRef = collection(db, "artifacts", appId, "users", userId, "customLists");
    const unsubLists = onSnapshot(listsRef, (snapshot) => {
        setCustomLists(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, e => { console.error(e); setError("Failed to load custom lists."); });

    return () => { unsubGear(); unsubLists(); };
  }, [userId]);

  // --- Memoized Calculations ---
  const { packingData, uniqueCategories, categoryToGearNamesMap, gearNameToModelsMap } = useMemo(() => {
    const allCategories = new Set();
    const catToNameMap = {};
    const nameToModelMap = {};

    Object.values(PREDEFINED_GEAR_LISTS).flat().forEach(item => {
        const category = item.category || 'Uncategorized';
        allCategories.add(category);
        if (!catToNameMap[category]) {
            catToNameMap[category] = new Set();
        }
        catToNameMap[category].add(item.name);
    });
     gear.forEach(item => {
        if(item.category) allCategories.add(item.category);
        if (item.name) {
            if (!nameToModelMap[item.name]) {
                nameToModelMap[item.name] = new Set();
            }
            if (item.model) {
                nameToModelMap[item.name].add(item.model);
            }
        }
     });

    for (const category in catToNameMap) {
        catToNameMap[category] = Array.from(catToNameMap[category]).sort();
    }
    for (const name in nameToModelMap) {
        nameToModelMap[name] = Array.from(nameToModelMap[name]).sort();
    }
    
    let packData = null;
    if (selectedList) {
        const isPredefined = 'predefined' in selectedList;
        let have = [];
        let combinedList = [];

        if (isPredefined) {
            const requiredItems = PREDEFINED_GEAR_LISTS[selectedList.name];
            const haveItems = gear.filter(gearItem => 
                requiredItems.some(reqItem => reqItem.name.toLowerCase() === gearItem.name.toLowerCase()) && gearItem.quantity > 0
            );
            const haveNames = new Set(haveItems.map(item => item.name.toLowerCase()));
            const needItems = requiredItems.filter(reqItem => !haveNames.has(reqItem.name.toLowerCase()));

            const allItemsForGrouping = [
                ...haveItems.map(item => ({ ...item, has: true })),
                ...needItems.map(item => ({ ...item, has: false, id: item.name }))
            ];

            const grouped = allItemsForGrouping.reduce((acc, item) => {
                const category = item.category || 'Uncategorized';
                if (!acc[category]) acc[category] = [];
                acc[category].push(item);
                return acc;
            }, {});

            combinedList = Object.entries(grouped)
                .map(([category, items]) => ({
                    category,
                    items: items.sort((a, b) => a.name.localeCompare(b.name))
                }))
                .sort((a, b) => a.category.localeCompare(b.category));
            
            have = haveItems;
        } else {
            const requiredItemIds = new Set(selectedList.items || []);
            have = gear.filter(gearItem => requiredItemIds.has(gearItem.id));
            
            const grouped = have.reduce((acc, item) => {
                const category = item.category || 'Uncategorized';
                if (!acc[category]) acc[category] = [];
                acc[category].push({ ...item, has: true });
                return acc;
            }, {});

            combinedList = Object.entries(grouped)
                .map(([category, items]) => ({
                    category,
                    items: items.sort((a, b) => a.name.localeCompare(b.name))
                }))
                .sort((a, b) => a.category.localeCompare(b.category));
        }
        
        const totalWeight = have.reduce((sum, item) => sum + ((item.weight || 0) * (item.quantity || 1)), 0);
        
        const categoryWeights = have.reduce((acc, item) => {
            const category = item.category || 'Uncategorized';
            const itemWeight = (item.weight || 0) * (item.quantity || 1);
            acc[category] = (acc[category] || 0) + itemWeight;
            return acc;
        }, {});

        const chartData = Object.entries(categoryWeights).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

        packData = { have, totalWeight, chartData, isPredefined, combinedList };
    }

    return {
        packingData: packData,
        uniqueCategories: Array.from(allCategories).sort(),
        categoryToGearNamesMap: catToNameMap,
        gearNameToModelsMap: nameToModelMap
    };
  }, [selectedList, gear]);

  // --- CRUD Functions ---
  const handleSaveGear = async (newGearList, currentUserId) => {
    const uid = currentUserId || userId;
    if (!uid) return;
    try {
      await setDoc(doc(db, "artifacts", appId, "users", uid), { gear: newGearList }, { merge: true });
    } catch (e) { console.error(e); setError("Could not save gear."); }
  };

  const addGearItem = (item) => handleSaveGear([...gear, { ...item, id: crypto.randomUUID(), retired: false }]);
  const updateGearItem = (updatedItem) => handleSaveGear(gear.map(g => g.id === updatedItem.id ? updatedItem : g));
  const deleteGearItem = (id) => handleSaveGear(gear.filter(g => g.id !== id));

  const addPredefinedGearItem = (itemName) => {
    const list = PREDEFINED_GEAR_LISTS[selectedList.name];
    const itemTemplate = list.find(i => i.name === itemName);

    addGearItem({
      name: itemName,
      model: '',
      category: itemTemplate ? itemTemplate.category : 'Uncategorized',
      weight: itemTemplate ? itemTemplate.weight : null,
      notes: '',
      quantity: 1,
    });
  };

  const saveCustomList = async (list) => {
    if (!userId) return;
    const listsRef = collection(db, "artifacts", appId, "users", userId, "customLists");
    const { id, ...dataToSave } = list;
    if (list.id) {
        await updateDoc(doc(listsRef, list.id), dataToSave);
    } else {
        await addDoc(listsRef, dataToSave);
    }
  };

  const handleCreateNewList = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaysLists = customLists.filter(list => list.date === today);
    let randomTitle = PREDEFINED_LIST_TITLES[Math.floor(Math.random() * PREDEFINED_LIST_TITLES.length)];
    
    let attempts = 0;
    while(todaysLists.some(list => list.name === randomTitle) && attempts < PREDEFINED_LIST_TITLES.length) {
        randomTitle = PREDEFINED_LIST_TITLES[Math.floor(Math.random() * PREDEFINED_LIST_TITLES.length)];
        attempts++;
    }
    
    if (attempts >= PREDEFINED_LIST_TITLES.length) {
        randomTitle = `New List ${new Date().getTime()}`; // Fallback for safety
    }

    const newList = {
        name: randomTitle,
        date: today,
        items: [],
    };
    saveCustomList(newList);
  };

  const deleteCustomList = async (listId) => {
    if (!userId) return;
    await deleteDoc(doc(db, "artifacts", appId, "users", userId, "customLists", listId));
    if(selectedList && selectedList.id === listId) setSelectedList(null);
  };

  const handleToggleItemInList = (gearItemId) => {
    if (!selectedList || 'predefined' in selectedList) return;

    const list = customLists.find(l => l.id === selectedList.id);
    if (!list) return;

    const items = list.items || [];
    const isAlreadyInList = items.includes(gearItemId);
    const newItems = isAlreadyInList
      ? items.filter(id => id !== gearItemId)
      : [...items, gearItemId];
    
    const updatedList = { ...list, items: newItems };
    saveCustomList(updatedList);
    setSelectedList(updatedList);
  };

  // --- Render Logic ---
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="bg-slate-200 min-h-screen font-sans text-gray-800 bg-cover bg-center" style={{backgroundImage: "url('https://images.unsplash.com/photo-1454496522488-7a8e488e8606?q=80&w=2070&auto=format&fit=crop')"}}>
      <div className="bg-white/70 backdrop-blur-sm min-h-screen">
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <Header />
          <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
            <GearInventoryPanel gear={gear} onAddClick={() => { setEditingGear(null); setIsGearModalOpen(true); }} onEditClick={(g) => { setEditingGear(g); setIsGearModalOpen(true); }} onDeleteClick={deleteGearItem} selectedList={selectedList} onToggleItemInList={handleToggleItemInList} />
            <ActivityPanel 
              selectedList={selectedList} 
              onSelectList={setSelectedList}
              packingData={packingData} 
              onAddPredefinedItem={addPredefinedGearItem} 
              customLists={customLists} 
              onNewListClick={handleCreateNewList} 
              onEditListClick={(l) => { setEditingList(l); setIsListModalOpen(true); }} 
              onDeleteListClick={deleteCustomList}
            />
          </main>
          <GearModal isOpen={isGearModalOpen} onClose={() => setIsGearModalOpen(false)} onSave={editingGear ? updateGearItem : addGearItem} onAdd={addGearItem} existingGear={editingGear} uniqueCategories={uniqueCategories} categoryToGearNamesMap={categoryToGearNamesMap} gearNameToModelsMap={gearNameToModelsMap} onDelete={deleteGearItem} customLists={customLists} onSelectList={setSelectedList} />
          <CustomListModal isOpen={isListModalOpen} onClose={() => setIsListModalOpen(false)} onSave={saveCustomList} existingList={editingList} allGear={gear} onDelete={deleteCustomList} />
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---
const Header = () => <header className="text-center"><h1 className="text-4xl md:text-5xl font-bold text-slate-800 tracking-tight">Packlist.Pro</h1><p className="mt-2 text-lg text-slate-600">Just Organize Your Stuff Already!</p></header>;

const GearInventoryPanel = ({ gear, onAddClick, onEditClick, onDeleteClick, selectedList, onToggleItemInList }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredGear = useMemo(() => {
        return gear.filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.model && item.model.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [gear, searchTerm]);

    const groupedGear = useMemo(() => {
        const groups = filteredGear.reduce((acc, item) => {
            const category = item.category || 'Uncategorized';
            if (!acc[category]) acc[category] = [];
            acc[category].push(item);
            return acc;
        }, {});
        return Object.keys(groups).sort().reduce((acc, key) => {
            const sortedItems = groups[key].sort((a, b) => {
                if (a.retired && !b.retired) return 1;
                if (!a.retired && b.retired) return -1;
                return a.name.localeCompare(b.name);
            });
            acc[key] = sortedItems;
            return acc;
        }, {});
    }, [filteredGear]);

    return (
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-lg"><div className="flex justify-between items-center mb-4"><h2 className="text-2xl font-bold text-slate-800">My Gear Inventory</h2><button onClick={onAddClick} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"><Plus size={18} /><span>Add Gear</span></button></div>
        <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
                type="text"
                placeholder="Search gear..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
            />
        </div>
        <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-2">{Object.keys(groupedGear).length > 0 ? Object.entries(groupedGear).map(([category, items]) => <GearCategoryGroup key={category} category={category} items={items} onEditClick={onEditClick} onDeleteClick={onDeleteClick} selectedList={selectedList} onToggleItemInList={onToggleItemInList} />) : <p className="text-center text-gray-500 py-8">No gear found.</p>}</div></div>
    );
};

const GearCategoryGroup = ({ category, items, onEditClick, onDeleteClick, selectedList, onToggleItemInList }) => {
    const [isOpen, setIsOpen] = useState(true);
    return (<div className="border border-slate-200 rounded-lg"><button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-3 bg-slate-100 hover:bg-slate-200 transition-colors rounded-t-lg"><h3 className="font-bold text-slate-800">{category}</h3>{isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}</button>{isOpen && <div className="p-2 space-y-2">{items.map(item => <GearItem key={item.id} item={item} onEdit={() => onEditClick(item)} onDelete={() => onDeleteClick(item.id)} selectedList={selectedList} onToggleItemInList={onToggleItemInList} />)}</div>}</div>);
};

const GearItem = ({ item, onEdit, onDelete, selectedList, onToggleItemInList }) => {
    const isCustomListSelected = selectedList && !('predefined' in selectedList);
    const isInList = isCustomListSelected && selectedList.items.includes(item.id);

    return (
        <div className={`bg-white/50 border border-slate-200 rounded-lg p-3 transition-shadow duration-300 hover:shadow-md ${item.retired ? 'opacity-50' : ''}`}>
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{item.name}</p>
                    {item.model && <p className="text-sm text-slate-500 italic truncate">{item.model}</p>}
                    <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1"><Weight size={12} /> {item.weight || 0}g</span>
                        <span className="flex items-center gap-1"><Package size={12} /> Qty: {item.quantity || 1}</span>
                    </div>
                </div>
                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    {isCustomListSelected && (
                        <button onClick={() => onToggleItemInList(item.id)} disabled={item.retired} className="p-1 rounded-full transition-colors disabled:opacity-25 disabled:cursor-not-allowed">
                            {isInList ? <Trash2 size={16} className="text-red-600" /> : <Plus size={16} className="text-green-600" />}
                        </button>
                    )}
                    <button onClick={onEdit} className="p-1 text-blue-600 hover:text-blue-800 transition-colors"><Edit size={16} /></button>
                </div>
            </div>
            {item.notes && <p className="mt-2 pt-2 border-t text-sm text-slate-600">{item.notes}</p>}
        </div>
    );
};

const ICONS = {
    "Trail Running": <Mountain className="text-green-600" />,
    "Road Running": <Wind className="text-blue-500" />,
    "Road Cycling": <Bike className="text-yellow-500" />,
    "Hotel Road Cycle Touring": <Bike className="text-orange-500" />,
    "Hiking": <Mountain className="text-teal-600" />,
    "Onebagging": <Briefcase className="text-indigo-500" />,
};

const ActivityPanel = ({ selectedList, onSelectList, packingData, onAddPredefinedItem, customLists, onNewListClick, onEditListClick, onDeleteListClick }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  };

  return (
    <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold text-slate-800 mb-4">Create a Packing List</h2>
      
      <h3 className="text-lg font-semibold text-slate-700 mb-2">Pre-defined Lists</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
        {Object.keys(PREDEFINED_GEAR_LISTS).map(name => (
          <button key={name} onClick={() => onSelectList({ name, predefined: true })} className={`flex flex-col items-center justify-center text-center p-2 border-2 rounded-lg transition-all transform hover:scale-105 ${selectedList?.name === name ? 'bg-green-100 border-green-500' : 'bg-slate-50 border-slate-200 hover:border-green-300'}`}>
            {React.cloneElement(ICONS[name] || <Package />, { size: 20 })}
            <span className="text-xs font-medium mt-1">{name}</span>
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center mb-2"><h3 className="text-lg font-semibold text-slate-700">My Custom Lists</h3><button onClick={onNewListClick} className="flex items-center gap-2 text-sm px-3 py-1 bg-orange-500 text-white rounded-lg shadow-sm hover:bg-orange-600 transition-colors"><Plus size={16}/>New List</button></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-6">
        {customLists.sort((a, b) => b.date.localeCompare(a.date)).map(list => (
            <div key={list.id} className={`relative p-2 border-2 rounded-lg transition-all ${selectedList?.id === list.id ? 'bg-green-100 border-green-500' : 'bg-slate-50 border-slate-200'}`}>
                <button onClick={() => onSelectList(list)} className="w-full text-left font-semibold">
                    <span className="block text-slate-500 text-xs">{formatDate(list.date)}</span>
                    {list.name}
                </button>
                <button onClick={() => onEditListClick(list)} className="absolute top-1 right-1 p-1 text-blue-600 hover:text-blue-800"><Edit size={14}/></button>
            </div>
        ))}
        {customLists.length === 0 && <p className="text-sm text-slate-500 italic text-center py-2 col-span-full">You haven't created any custom lists yet.</p>}
      </div>

      {selectedList && packingData && (
        <div>
          <div className="flex justify-between items-baseline"><h3 className="text-xl font-bold text-slate-800 mb-3">Packing for {selectedList.name}</h3></div>
          <div className="space-y-4">
            <RecommendedList 
                items={packingData.combinedList} 
                onAddItem={packingData.isPredefined ? onAddPredefinedItem : null} 
            />
          </div>
          {packingData.chartData && packingData.chartData.length > 0 && (
            <div className="mt-8">
                <div className="flex justify-between items-baseline">
                    <h4 className="text-lg font-semibold text-slate-700 mb-2">Weight Distribution</h4>
                    <span className="font-bold text-slate-600 flex items-center gap-2"><Weight size={18}/> {(packingData.totalWeight / 1000).toFixed(2)}kg</span>
                </div>
                <WeightDistributionChart data={packingData.chartData} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const RecommendedList = ({ items, onAddItem }) => {
    const totalItems = items.reduce((acc, group) => acc + group.items.length, 0);
    return (
    <div>
        <h4 className={`text-lg font-semibold text-slate-700 mb-2`}>Packing List ({totalItems})</h4>
        {items.map(group => (
            <div key={group.category} className="mt-2">
                <h5 className="font-semibold text-slate-600 text-sm uppercase tracking-wider">{group.category}</h5>
                <ul className="space-y-1 text-sm mt-1">
                    {group.items.map(item => {
                        const hasItem = item.has;
                        const key = item.id;
                        const name = item.name;
                        const model = item.model;
                        const quantity = item.quantity;
                        
                        return (
                            <li key={key} className={`flex justify-between items-center p-1 rounded-md ${!hasItem && 'hover:bg-slate-100'}`}>
                            <div className={`transition-colors ${!hasItem || item.retired ? 'text-gray-400' : 'text-gray-700'}`}>
                                <span className={`inline-block w-2 h-2 rounded-full mr-3 ${hasItem ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                <span>
                                {name}
                                {model && <em className="text-slate-500 ml-2">({model})</em>}
                                {hasItem && quantity > 1 && <span className="text-slate-500 ml-2">x{quantity}</span>}
                                {hasItem && item.retired && <span className="text-xs text-red-500 ml-2 font-semibold">(Retired)</span>}
                                </span>
                            </div>
                            {!hasItem && onAddItem && (
                                <button onClick={() => onAddItem(name)} className="p-1 rounded-full text-green-600 hover:bg-green-100 transition-colors" title={`Add ${name} to inventory`}>
                                <Plus size={16} />
                                </button>
                            )}
                            </li>
                        );
                    })}
                </ul>
            </div>
        ))}
    </div>
    );
};


const GearModal = ({ isOpen, onClose, onSave, onAdd, existingGear, uniqueCategories, categoryToGearNamesMap, onDelete, customLists, onSelectList }) => {
  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [category, setCategory] = useState('');
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [retired, setRetired] = useState(false);
  const [error, setError] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [showNewGearNameInput, setShowNewGearNameInput] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    if (isOpen) {
        const currentCategory = existingGear?.category || '';
        const isExistingCategory = uniqueCategories.includes(currentCategory);
        const currentName = existingGear?.name || '';
        const isExistingName = categoryToGearNamesMap[currentCategory]?.includes(currentName);

        setCategory(currentCategory);
        setName(currentName);
        setModel(existingGear?.model || '');
        setWeight(existingGear?.weight || '');
        setNotes(existingGear?.notes || '');
        setQuantity(existingGear?.quantity || 1);
        setRetired(existingGear?.retired || false);
        
        setShowNewCategoryInput(!!(currentCategory && !isExistingCategory));
        setShowNewGearNameInput(!!(currentName && !isExistingName));
        
        setError('');
        setIsConfirmingDelete(false);
    }
  }, [existingGear, isOpen, uniqueCategories, categoryToGearNamesMap]);

  const handleCategorySelectChange = (e) => {
    const value = e.target.value;
    setName('');
    setModel('');
    setShowNewGearNameInput(false);
    if (value === '_new_') {
        setShowNewCategoryInput(true);
        setCategory('');
    } else {
        setShowNewCategoryInput(false);
        setCategory(value);
    }
  };

  const handleNameSelectChange = (e) => {
    const value = e.target.value;
    setModel('');
    if (value === '_new_') {
        setShowNewGearNameInput(true);
        setName('');
    } else {
        setShowNewGearNameInput(false);
        setName(value);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Gear name is required.'); return; }
    const gearData = { id: existingGear?.id, name: name.trim(), model: model.trim(), category: category.trim(), weight: parseInt(weight, 10) || 0, notes: notes.trim(), quantity: parseInt(quantity, 10) || 1, retired };
    if (existingGear) {
        onSave(gearData);
    } else {
        onAdd(gearData);
    }
    onClose();
  };

  const handleDelete = () => {
    onDelete(existingGear.id);
    onClose();
  };

  const handleSelectList = (list) => {
    onSelectList(list);
    onClose();
  };

  const listsThisItemIsIn = useMemo(() => {
    if (!existingGear) return [];
    return customLists.filter(list => list.items && list.items.includes(existingGear.id));
  }, [customLists, existingGear]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md transform transition-all">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{existingGear ? 'Edit Gear' : 'Add New Gear'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>
        {isConfirmingDelete ? (
            <div className="text-center">
                <p className="text-lg">Are you sure you want to delete this item?</p>
                <p className="font-bold mt-2">{name} {model && `(${model})`}</p>
                <div className="flex justify-center gap-4 mt-6">
                    <button onClick={() => setIsConfirmingDelete(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancel</button>
                    <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Yes, Delete</button>
                </div>
            </div>
        ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="category-select" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select id="category-select" value={showNewCategoryInput ? '_new_' : category} onChange={handleCategorySelectChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500">
                        <option value="">-- Select --</option>
                        {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        <option value="_new_">Add New...</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="gear-name" className="block text-sm font-medium text-gray-700 mb-1">Gear Name</label>
                    <select id="gear-name-select" value={showNewGearNameInput ? '_new_' : name} onChange={handleNameSelectChange} disabled={!category} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100">
                        <option value="">-- Select --</option>
                        {(categoryToGearNamesMap[category] || []).map(nameOpt => <option key={nameOpt} value={nameOpt}>{nameOpt}</option>)}
                        <option value="_new_">Add New...</option>
                    </select>
                </div>
            </div>
            {showNewCategoryInput && (
                <div>
                <label htmlFor="new-category" className="block text-sm font-medium text-gray-700 mb-1">New Category Name</label>
                <input type="text" id="new-category" value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" placeholder="Enter new category" autoFocus />
                </div>
            )}
            {showNewGearNameInput && (
                <div>
                <label htmlFor="new-gear-name" className="block text-sm font-medium text-gray-700 mb-1">New Gear Name</label>
                <input type="text" id="new-gear-name" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" placeholder="Enter new gear name" autoFocus />
                </div>
            )}
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            
            <div>
                <label htmlFor="gear-model" className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                <input type="text" id="gear-model" value={model} onChange={e => setModel(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" placeholder="e.g., Osprey Talon 22"/>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">Weight (grams)</label>
                <input type="number" min="0" id="weight" value={weight} onChange={e => setWeight(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" placeholder="e.g., 250" />
                </div>
                <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input type="number" min="1" id="quantity" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" />
                </div>
            </div>

            <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"></textarea>
            </div>

            {existingGear && <div className="flex items-center">
                <input id="retired" type="checkbox" checked={retired} onChange={(e) => setRetired(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                <label htmlFor="retired" className="ml-2 block text-sm text-gray-900">Retire this item</label>
            </div>}

            {existingGear && listsThisItemIsIn.length > 0 && (
                <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Part of these lists:</h3>
                    <div className="flex flex-wrap gap-2">
                        {listsThisItemIsIn.map(list => (
                            <button key={list.id} type="button" onClick={() => handleSelectList(list)} className="px-2 py-1 bg-gray-200 text-gray-800 text-xs rounded-md hover:bg-gray-300">{list.name}</button>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center pt-4">
                <div>
                    {existingGear && <button type="button" onClick={() => setIsConfirmingDelete(true)} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">Delete</button>}
                </div>
                <div className="flex gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">{existingGear ? 'Save Changes' : 'Add Gear'}</button>
                </div>
            </div>
            </form>
        )}
      </div>
    </div>
  );
};

const CustomListModal = ({ isOpen, onClose, onSave, existingList, allGear, onDelete }) => {
    const [name, setName] = useState('');
    const [selectedItemIds, setSelectedItemIds] = useState([]);
    const [date, setDate] = useState('');
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    
    const groupedGear = useMemo(() => {
        const groups = allGear.filter(item => !item.retired).reduce((acc, item) => {
            const category = item.category || 'Uncategorized';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(item);
            return acc;
        }, {});

        return Object.entries(groups)
            .map(([category, items]) => ({
                category,
                items: items.sort((a, b) => a.name.localeCompare(b.name))
            }))
            .sort((a, b) => a.category.localeCompare(b.category));
    }, [allGear]);

    useEffect(() => {
        if (isOpen) {
            setName(existingList?.name || '');
            setSelectedItemIds(existingList?.items || []);
            setDate(existingList?.date || new Date().toISOString().split('T')[0]);
            setIsConfirmingDelete(false);
        }
    }, [isOpen, existingList]);

    const handleToggleItem = (itemId) => {
        setSelectedItemIds(prev => prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSave({ id: existingList?.id, name, items: selectedItemIds, date });
        onClose();
    };

    const handleDelete = () => {
        onDelete(existingList.id);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg transform transition-all flex flex-col">
                <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold text-gray-900">{existingList ? 'Edit' : 'Create'} Custom List</h2><button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button></div>
                {isConfirmingDelete ? (
                    <div className="text-center">
                        <p className="text-lg">Are you sure you want to delete this list?</p>
                        <p className="font-bold mt-2">{name}</p>
                        <div className="flex justify-center gap-4 mt-6">
                            <button onClick={() => setIsConfirmingDelete(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancel</button>
                            <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Yes, Delete</button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex-grow flex flex-col">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="list-date" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input type="date" id="list-date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" />
                            </div>
                            <div>
                                <label htmlFor="list-name" className="block text-sm font-medium text-gray-700 mb-1">List Name</label>
                                <input type="text" id="list-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Weekend Backpacking Trip" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" />
                            </div>
                        </div>
                        <p className="font-medium text-gray-700 mt-4 mb-2">Select items from your inventory:</p>
                        <div className="flex-grow border rounded-lg p-2 overflow-y-auto max-h-[40vh] space-y-1">
                            {groupedGear.map(group => (
                                <div key={group.category}>
                                    <h5 className="font-semibold text-gray-600 text-sm uppercase tracking-wider mt-2 px-2">{group.category}</h5>
                                    {group.items.map(item => (
                                        <label key={item.id} className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${selectedItemIds.includes(item.id) ? 'bg-green-100' : 'hover:bg-slate-100'}`}>
                                            <input type="checkbox" checked={selectedItemIds.includes(item.id)} onChange={() => handleToggleItem(item.id)} className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                                            <span>
                                                {item.name}
                                                {item.model && <em className="text-gray-500 ml-2">({item.model})</em>}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between items-center pt-4 mt-2">
                            <div>
                                {existingList && <button type="button" onClick={() => setIsConfirmingDelete(true)} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">Delete</button>}
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Save List</button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

const COLORS = ['#16a34a', '#0ea5e9', '#f97316', '#f59e0b', '#8b5cf6', '#10b981', '#facc15', '#84cc16'];

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0];
        const percent = typeof data.percent === 'number' ? (data.percent * 100).toFixed(1) : '0.0';
        return (
            <div className="bg-white p-2 border border-gray-300 rounded-lg shadow-sm">
                <p className="font-bold">{data.name}</p>
                <p className="text-sm text-gray-700">{`Weight: ${data.value}g (${percent}%)`}</p>
            </div>
        );
    }
    return null;
};

const WeightDistributionChart = ({ data }) => {
    return (
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ percent }) => (percent && percent > 0.02 ? `${(percent * 100).toFixed(0)}%` : null)}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};


const LoadingSpinner = () => <div className="flex flex-col justify-center items-center h-screen bg-gray-50"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-600"></div><p className="mt-4 text-lg text-gray-600">Loading your gear...</p></div>;
const ErrorMessage = ({ message }) => <div className="flex justify-center items-center h-screen bg-red-50"><div className="text-center p-8 bg-white rounded-lg shadow-md"><h2 className="text-2xl font-bold text-red-600">An Error Occurred</h2><p className="mt-2 text-gray-700">{message}</p></div></div>;