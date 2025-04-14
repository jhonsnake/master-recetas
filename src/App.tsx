import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Home, ChefHat, Users, ShoppingCart, UtensilsCrossed, Calendar } from 'lucide-react';
import { IngredientList } from './components/ingredients/IngredientList';
import { RecipeList } from './components/recipes/RecipeList';
import { PersonList } from './components/persons/PersonList';
import { MealPlanner } from './components/meal-planning/MealPlanner';
import { ShoppingList } from './components/shopping/ShoppingList';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between h-16">
              <div className="flex">
                <Link to="/" className="flex items-center px-4 py-2 text-gray-700 hover:text-gray-900">
                  <Home className="w-5 h-5 mr-2" />
                  <span>Inicio</span>
                </Link>
                <Link to="/ingredientes" className="flex items-center px-4 py-2 text-gray-700 hover:text-gray-900">
                  <ChefHat className="w-5 h-5 mr-2" />
                  <span>Ingredientes</span>
                </Link>
                <Link to="/recetas" className="flex items-center px-4 py-2 text-gray-700 hover:text-gray-900">
                  <UtensilsCrossed className="w-5 h-5 mr-2" />
                  <span>Recetas</span>
                </Link>
                <Link to="/personas" className="flex items-center px-4 py-2 text-gray-700 hover:text-gray-900">
                  <Users className="w-5 h-5 mr-2" />
                  <span>Personas</span>
                </Link>
                <Link to="/planificador" className="flex items-center px-4 py-2 text-gray-700 hover:text-gray-900">
                  <Calendar className="w-5 h-5 mr-2" />
                  <span>Planificador</span>
                </Link>
                <Link to="/compras" className="flex items-center px-4 py-2 text-gray-700 hover:text-gray-900">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  <span>Lista de Compras</span>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/ingredientes" element={<IngredientList />} />
            <Route path="/recetas" element={<RecipeList />} />
            <Route path="/personas" element={<PersonList />} />
            <Route path="/planificador" element={<MealPlanner />} />
            <Route path="/compras" element={<ShoppingList />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function HomePage() {
  const features = [
    {
      icon: ChefHat,
      title: "Gestión de Ingredientes",
      description: "Administra tus ingredientes con información nutricional detallada",
      color: "blue",
      path: "/ingredientes"
    },
    {
      icon: UtensilsCrossed,
      title: "Gestión de Recetas",
      description: "Crea y organiza tus recetas con cálculos nutricionales automáticos",
      color: "blue",
      path: "/recetas"
    },
    {
      icon: Users,
      title: "Perfiles Nutricionales",
      description: "Crea perfiles personalizados y establece metas nutricionales",
      color: "green",
      path: "/personas"
    },
    {
      icon: Calendar,
      title: "Planificador de Comidas",
      description: "Organiza tus comidas semanales y monitorea tu nutrición",
      color: "purple",
      path: "/planificador"
    },
    {
      icon: ShoppingCart,
      title: "Lista de Compras",
      description: "Genera listas de compras basadas en tus recetas planificadas",
      color: "purple",
      path: "/compras"
    }
  ];

  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">
        Gestor de Recetas y Nutrición
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => (
          <Link
            key={feature.path}
            to={feature.path}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <feature.icon className={`w-12 h-12 mx-auto mb-4 text-${feature.color}-500`} />
            <h2 className="text-xl font-semibold mb-2">{feature.title}</h2>
            <p className="text-gray-600">
              {feature.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default App;