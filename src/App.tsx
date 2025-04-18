import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Home, ChefHat, Users, ShoppingCart, UtensilsCrossed, Calendar, Menu, X } from 'lucide-react';
import { IngredientList } from './components/ingredients/IngredientList';
import { RecipeList } from './components/recipes/RecipeList';
import { PersonList} from './components/persons/PersonList';
import { MealPlanner } from './components/meal-planning/MealPlanner';
import { ShoppingList } from './components/shopping/ShoppingList';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import { User as UserType } from './types';
import { Auth } from './components/auth/Auth';
import { useUserStore } from './store';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);
  const { user, setUser } = useUserStore();
  const [sessionFetched, setSessionFetched] = useState<boolean>(false);

  const isLoggedIn = !!user;

  useEffect(() => {
    const fetchSession = async () => {
        const { data } = await supabase.auth.getSession();
        if (data && data.session) {
          const { session: currentSession } = data;
          setSession(currentSession);
          setUser(
            currentSession.user ? { email: currentSession.user.email!, id: currentSession.user.id, created_at: currentSession.user.created_at! } as UserType : null
          );
        } else {
          setUser(null);
        }
        setSessionFetched(true);
    };

    // Fetch session initially
    fetchSession();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(
          session?.user ? { email: session.user.email!, id: session.user.id, created_at: session.user.created_at! } as UserType : null
        );
        // If user logs out, ensure sessionFetched is still true to avoid flicker
        if (!session) {
          setSessionFetched(true);
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [setUser]); // Depend only on setUser

  if (!sessionFetched) {
    // Optional: Add a loading indicator here
    return <div className="flex justify-center items-center min-h-screen">Cargando...</div>;
  }

  if (!isLoggedIn) {
    return (
      <Auth onLoginSuccess={async () => {
        // The onAuthStateChange listener will handle setting the session and user
        // No need to manually fetch session here again
      }} />
    );
  }

  const logout = async () => {
    setShowUserMenu(false); // Close menu on logout
    await supabase.auth.signOut();
    // The onAuthStateChange listener will handle setting user and session to null
  };

  const navLinks = [
    { to: "/", icon: Home, label: "Inicio" },
    { to: "/ingredientes", icon: ChefHat, label: "Ingredientes" },
    { to: "/recetas", icon: UtensilsCrossed, label: "Recetas" },
    { to: "/personas", icon: Users, label: "Personas" },
    { to: "/planificador", icon: Calendar, label: "Planificador" },
    { to: "/compras", icon: ShoppingCart, label: "Lista de Compras" },
  ];

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-lg sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              {/* Left side: Logo */}
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="flex items-center text-gray-700 hover:text-gray-900 font-bold text-xl">
                  <Home className="w-6 h-6 mr-2 text-blue-600" />
                  <span className="hidden sm:inline">Master Recetas</span>
                </Link>
              </div>

              {/* Center: Desktop Navigation */}
              <div className="hidden md:flex md:space-x-4 lg:space-x-6 items-center">
                {navLinks.map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <link.icon className="w-4 h-4 mr-1.5" />
                    {link.label}
                  </Link>
                ))}
              </div>

              {/* Right side: User Menu & Mobile Menu Button */}
              <div className="flex items-center">
                {/* User Menu */}
                {isLoggedIn && (
                  <div className="relative ml-3">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      aria-expanded={showUserMenu}
                      aria-haspopup="true"
                    >
                      <span className="sr-only">Abrir menú de usuario</span>
                      <Users className="w-5 h-5" />
                      <span className="hidden lg:inline ml-2 text-sm font-medium">
                        {user?.email ?? ''}
                      </span>
                    </button>
                    {showUserMenu && (
                      <div
                        className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-20"
                        role="menu"
                        aria-orientation="vertical"
                        aria-labelledby="user-menu-button"
                      >
                        <button
                          onClick={logout}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Mobile Menu Button */}
                <div className="ml-2 md:hidden">
                  <button
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                    className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                    aria-controls="mobile-menu"
                    aria-expanded={showMobileMenu}
                  >
                    <span className="sr-only">Abrir menú principal</span>
                    {showMobileMenu ? (
                      <X className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Menu className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile menu, show/hide based on menu state. */}
          {showMobileMenu && (
            <div className="md:hidden absolute top-16 inset-x-0 bg-white shadow-lg z-40" id="mobile-menu">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                {navLinks.map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <link.icon className="w-5 h-5 mr-3" />
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/ingredientes" element={<IngredientList />} />
            <Route path="/recetas" element={<RecipeList />} />
            <Route path="/personas" element={<PersonList />} />
            <Route path="/planificador" element={<MealPlanner />} />
            <Route path="/compras" element={<ShoppingList />} />
            {/* Redirect root or unmatched paths to home if logged in */}
            <Route path="*" element={<Navigate to="/" replace />} />
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

  // Dynamically generate Tailwind text color classes
  const colorClasses: { [key: string]: string } = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    purple: 'text-purple-500',
  };

  return (
    <div className="text-center">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">
        Gestor de Recetas y Nutrición
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => (
          <Link
            key={feature.path}
            to={feature.path}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow flex flex-col items-center text-center"
          >
            <feature.icon className={`w-12 h-12 mx-auto mb-4 ${colorClasses[feature.color] || 'text-gray-500'}`} />
            <h2 className="text-xl font-semibold mb-2">{feature.title}</h2>
            <p className="text-gray-600 text-sm">
              {feature.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default App;
