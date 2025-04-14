import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Home, ChefHat, Users, ShoppingCart, UtensilsCrossed, Calendar } from 'lucide-react';
import { IngredientList } from './components/ingredients/IngredientList';
import { RecipeList } from './components/recipes/RecipeList';
import { PersonList} from './components/persons/PersonList';
import { MealPlanner } from './components/meal-planning/MealPlanner';
import { ShoppingList } from './components/shopping/ShoppingList';
import { supabase } from './lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { AppUser, User as UserType } from './types';
import { Auth } from './components/auth/Auth';
import { useUserStore } from './store';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const { user, setUser, loading } = useUserStore();

  useEffect(() => {
    const fetchSession = async () => {
        const { data } = await supabase.auth.getSession();
        if (data && data.session) {
          const { session } = data;
          setSession(session);
          setUser(
            session.user ? { email: session.user.email!, id: session.user.id, created_at: session.user.created_at! } as UserType : null
          );
        }
        setSessionFetched(true);
    };
    fetchSession();
  }, [session]);
  const logout = () => supabase.auth.signOut();
  const [sessionFetched, setSessionFetched] = useState<boolean>(false)
  const isLoggedIn = user !== null;



  return (
    <>
      {showAuthModal && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex">
          <div className="relative p-8 bg-white w-full max-w-md m-auto flex-col flex rounded-lg">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-0 right-0 m-4 text-gray-600 hover:text-gray-800 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="mt-4">
              <Auth onLoginSuccess={() => setShowAuthModal(false)} />
            </div>
          </div>
        </div>
      )}

    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between h-16">
              <div className="flex">
                <Link to="/" className="flex items-center px-4 py-2 text-gray-700 hover:text-gray-900 font-bold text-xl">
                  <Home className="w-5 h-5 mr-2" />
                  <span>Master Recetas</span>
                </Link>
              </div>
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
              <div className="flex items-center">
                {sessionFetched && !isLoggedIn ? (
                   <button onClick={() => setShowAuthModal(true)} className="flex items-center px-4 py-2 text-gray-700 hover:text-gray-900">
                      Login
                    </button>
                 ) : sessionFetched && isLoggedIn ? (
                  <div className="relative">
                    <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center px-4 py-2 text-gray-700 hover:text-gray-900">
                      <Users className="w-5 h-5 mr-2" />
                      <span className="mr-2">
                        {user?.email ?? ''}
                      </span>
                    </button>
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                        <button
                          onClick={logout}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <></>
                )}
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
    </>
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