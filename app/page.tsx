"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX}px`;
        cursorRef.current.style.top = `${e.clientY}px`;
      }
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("mousemove", handleMouseMove);
    
    // Animasyon sınıflarını istemci tarafında ekle
    document.body.classList.add('animate-fadeIn');
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-indigo-950 dark:to-blue-900 selection:bg-indigo-500/20 selection:text-indigo-700 dark:selection:bg-indigo-500/30 dark:selection:text-indigo-300">
      {/* Custom cursor for desktop (visual enhancement) */}
      {isMounted && (
        <div 
          ref={cursorRef}
          className="fixed hidden lg:block w-8 h-8 pointer-events-none z-50 rounded-full border-2 border-indigo-500 mix-blend-difference transition-transform duration-200" 
          style={{ transform: "translate(-50%, -50%)" }}
        ></div>
      )}

      {/* Header */}
      <header className={`w-full py-4 px-4 sm:px-8 lg:px-12 flex justify-between items-center sticky top-0 z-50 transition-all duration-300 ${
        isScrolled ? "backdrop-blur-lg bg-white/70 dark:bg-black/70 shadow-lg shadow-indigo-500/5" : "bg-transparent"
      }`}>
        <div className="flex items-center">
          <Image
            src="https://acadezone.s3.eu-central-1.amazonaws.com/email-assets/logo.png" 
            alt="Acadezone Logo" 
            width={180}
            height={50}
            priority
            className="h-10 w-auto transition-opacity duration-300 hover:opacity-80"
          />
          <div className="hidden md:block ml-3">
            <span className="bg-gradient-to-r from-indigo-600 to-blue-400 text-xs text-white px-2 py-1 rounded-md font-medium">BETA</span>
          </div>
        </div>
        
        <nav className={`${isMenuOpen ? "flex flex-col absolute top-full left-0 w-full bg-white/95 dark:bg-gray-900/95 shadow-xl backdrop-blur-lg py-6 px-8 space-y-4 border-t border-indigo-100 dark:border-indigo-900 animate-fadeIn" : "hidden"} md:flex md:relative md:top-0 md:flex-row md:bg-transparent md:border-0 md:shadow-none md:space-y-0 md:space-x-10 md:p-0 md:items-center transition-all duration-300`}>
          <Link href="#services" onClick={() => setIsMenuOpen(false)} className="group text-gray-700 dark:text-gray-200 md:hover:text-indigo-600 dark:md:hover:text-indigo-400 transition-colors duration-300 font-medium overflow-hidden relative px-1">
            <span className="relative z-10">Services</span>
            <span className="absolute w-full h-1 bg-indigo-400/20 dark:bg-indigo-500/20 left-0 bottom-0 transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100"></span>
          </Link>
          <Link href="#features" onClick={() => setIsMenuOpen(false)} className="group text-gray-700 dark:text-gray-200 md:hover:text-indigo-600 dark:md:hover:text-indigo-400 transition-colors duration-300 font-medium overflow-hidden relative px-1">
            <span className="relative z-10">Features</span>
            <span className="absolute w-full h-1 bg-indigo-400/20 dark:bg-indigo-500/20 left-0 bottom-0 transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100"></span>
          </Link>
          <Link href="#contact" onClick={() => setIsMenuOpen(false)} className="group text-gray-700 dark:text-gray-200 md:hover:text-indigo-600 dark:md:hover:text-indigo-400 transition-colors duration-300 font-medium overflow-hidden relative px-1">
            <span className="relative z-10">Contact</span>
            <span className="absolute w-full h-1 bg-indigo-400/20 dark:bg-indigo-500/20 left-0 bottom-0 transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100"></span>
          </Link>
          <Link href="/exam-login" onClick={() => setIsMenuOpen(false)} className="md:hidden lg:inline-flex items-center justify-center px-4 py-2 bg-white/10 dark:bg-indigo-900/30 backdrop-blur-sm text-indigo-600 dark:text-indigo-300 font-medium rounded-md border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition duration-300">
            Login
          </Link>
          <Link href="/exam-login" onClick={() => setIsMenuOpen(false)} className="inline-flex items-center justify-center px-4 py-2 md:ml-2 text-white font-medium rounded-md bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400 transition-all duration-300 shadow-lg shadow-indigo-500/20">
            Start Assessment
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </nav>
        
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)} 
          className="md:hidden relative z-50 flex items-center justify-center w-10 h-10 text-gray-700 dark:text-gray-200 focus:outline-none rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <span className="sr-only">Toggle menu</span>
          <div className="relative w-6 h-5">
            <span className={`absolute block h-0.5 w-6 bg-current transform transition-transform duration-300 ${isMenuOpen ? 'rotate-45 top-2.5' : 'top-0.5'}`}></span>
            <span className={`absolute block h-0.5 bg-current transform transition-all duration-300 ${isMenuOpen ? 'opacity-0 w-0' : 'opacity-100 w-6 top-2.5'}`}></span>
            <span className={`absolute block h-0.5 w-6 bg-current transform transition-transform duration-300 ${isMenuOpen ? '-rotate-45 top-2.5' : 'top-4.5'}`}></span>
          </div>
        </button>
      </header>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 sm:px-8 lg:px-12 text-center py-16 sm:py-28 overflow-hidden">
        <div className="relative w-full max-w-6xl mx-auto">
          {/* Animated background elements */}
          <div className="absolute -top-40 -left-20 w-80 h-80 bg-blue-500/10 dark:bg-blue-500/20 rounded-full filter blur-3xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-40 -right-20 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 dark:bg-purple-500/20 rounded-full filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
          
          {/* Decorative geometry */}
          <div className="hidden lg:block absolute -right-20 top-40 w-32 h-32 border-2 border-indigo-300/20 rounded-xl transform rotate-12 animate-float"></div>
          <div className="hidden lg:block absolute -left-16 bottom-20 w-24 h-24 border-2 border-blue-300/20 rounded-full transform animate-float animation-delay-2000"></div>
          <div className="hidden lg:block absolute right-40 bottom-10 w-20 h-20 border-2 border-purple-300/20 rounded-lg transform -rotate-12 animate-float animation-delay-1000"></div>
          
          <div className="relative">
            {/* Subtle top badge */}
            <div className={`flex justify-center mb-8 ${isMounted ? 'animate-fadeIn' : ''}`}>
              <div className="px-4 py-1.5 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-xl border border-indigo-100 dark:border-indigo-900 backdrop-blur-sm">
                <span className="text-gray-600 dark:text-gray-300 text-sm font-medium">Trusted by 500+ enterprises</span>
              </div>
            </div>
            
            <div className={`space-y-8 ${isMounted ? 'animate-fadeInUp' : ''}`}>
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
                <span className="relative inline-block mb-3 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-400 dark:to-blue-300">
                  Acadezone
                  <span className="absolute w-full h-1 bg-gradient-to-r from-indigo-500 to-blue-500 bottom-0 left-0 transform scale-x-100 origin-left"></span>
                </span>
                <br />
                <span className="inline-block text-3xl sm:text-4xl md:text-4xl leading-tight font-bold relative">
                  <span className="relative z-10">Measure professional excellence</span>
                  <span className="absolute -z-10 w-full h-3 bg-indigo-200/40 dark:bg-indigo-700/40 bottom-1 left-0"></span>
                </span>
              </h1>
              
              <p className="max-w-2xl mx-auto text-xl md:text-2xl text-gray-600 dark:text-gray-300 leading-relaxed">
                An advanced assessment platform that transforms how organizations evaluate professional competencies and industry qualifications.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12 pt-4">
                <Link href="/exam-login" className="w-full sm:w-auto px-10 py-4 border-0 text-lg font-medium rounded-xl text-white bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400 shadow-xl shadow-indigo-500/30 dark:shadow-indigo-700/30 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                  Take an Assessment
                </Link>
                <Link href="#features" className="w-full sm:w-auto px-10 py-4 border border-indigo-200 dark:border-indigo-800 text-lg font-medium rounded-xl text-indigo-600 dark:text-indigo-300 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                  Learn More
                </Link>
              </div>
            </div>
            
            {/* Trust indicators */}
            <div className="mt-20 mb-6 opacity-80">
              <p className="text-sm uppercase text-gray-500 dark:text-gray-400 font-medium tracking-wide mb-6">Trusted by leading organizations</p>
              <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8">
                {['Microsoft', 'Google', 'Amazon', 'IBM', 'Oracle'].map((company) => (
                  <div key={company} className="text-gray-400 dark:text-gray-500 font-semibold text-xl">
                    {company}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats with enhanced styling */}
        <div className="mt-28 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-blue-500/5 dark:from-indigo-500/10 dark:to-blue-500/10 transform -skew-y-1 rounded-3xl"></div>
          <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10 max-w-5xl mx-auto px-6 py-10">
            {[
              { value: '300+', label: 'Assessments', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
              { value: '50+', label: 'Industries', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
              { value: '10K+', label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
              { value: '99%', label: 'Accuracy', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
            ].map((stat, index) => (
              <div key={index} className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm p-6 md:p-8 rounded-xl shadow-xl border border-indigo-50 dark:border-indigo-900 transform transition-all duration-500 hover:scale-105 hover:shadow-2xl group">
                <div className="flex flex-col items-center md:items-start text-center md:text-left">
                  <div className="mb-4 p-3 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/50 dark:to-blue-900/50 text-indigo-600 dark:text-indigo-400 group-hover:from-indigo-100 group-hover:to-blue-100 dark:group-hover:from-indigo-800/50 dark:group-hover:to-blue-800/50 transition-colors duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                    </svg>
                  </div>
                  <div className="mt-1">
                    <div className="text-indigo-600 dark:text-indigo-400 font-bold text-3xl md:text-4xl mb-1">{stat.value}</div>
                    <div className="text-gray-600 dark:text-gray-300 font-medium">{stat.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Services Section with improved layout and animations */}
      <section className="py-24 bg-white dark:bg-gray-800 relative" id="services">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-white dark:from-indigo-950/50 dark:to-gray-800 pointer-events-none"></div>
        
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-indigo-200/20 dark:bg-indigo-700/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-blue-200/20 dark:bg-blue-700/20 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 relative">
          <div className="text-center mb-20">
            <div className="inline-block">
              <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-2">What we offer</p>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white relative inline-block">
                Our Services
                <div className="absolute -bottom-2 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transform origin-left"></div>
              </h2>
            </div>
            <p className="mt-8 max-w-3xl text-xl text-gray-600 dark:text-gray-300 mx-auto leading-relaxed">
              Comprehensive assessment solutions tailored for various industry sectors, designed to evaluate professional competencies with precision.
            </p>
          </div>

          <div className="mt-16 grid gap-10 grid-cols-1 md:grid-cols-3">
            {[
              {
                icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
                title: "Skills Assessment",
                description: "Comprehensive evaluation of technical and soft skills using advanced psychometric methodologies and industry-specific benchmarks.",
                color: "from-blue-500 to-indigo-500"
              },
              {
                icon: "M13 10V3L4 14h7v7l9-11h-7z",
                title: "Real-time Analytics",
                description: "Access immediate test results with detailed analytics, insights, and personalized recommendations for improvement.",
                color: "from-indigo-500 to-purple-500"
              },
              {
                icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
                title: "Performance Tracking",
                description: "Monitor performance trends, identify improvement areas, and track progress over time with our advanced tracking system.",
                color: "from-purple-500 to-indigo-500"
              }
            ].map((service, index) => (
              <div key={index} className="bg-gradient-to-br from-white to-indigo-50/50 dark:from-gray-800 dark:to-indigo-900/30 rounded-2xl shadow-xl p-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 group relative overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${service.color}`}></div>
                
                <div className="text-indigo-600 dark:text-indigo-400 mb-6 w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-white dark:from-indigo-900/70 dark:to-gray-800/70 flex items-center justify-center group-hover:from-indigo-200 group-hover:to-white dark:group-hover:from-indigo-800/70 dark:group-hover:to-indigo-900/70 transition-colors duration-300 shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={service.icon} />
                  </svg>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">{service.title}</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-300 leading-relaxed">{service.description}</p>
                
                <div className="mt-8 flex items-center text-indigo-600 dark:text-indigo-400 font-medium">
                  <span>Learn more</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section with improved visuals and animation */}
      <section className="py-24 bg-gradient-to-br from-indigo-50 to-blue-100/70 dark:from-gray-900 dark:to-indigo-950" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="inline-block mb-6">
                <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-2">Platform advantages</p>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white relative">
                  Why Choose Acadezone?
                  <div className="absolute -bottom-2 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transform origin-left"></div>
                </h2>
              </div>
              
              <p className="text-xl text-gray-600 dark:text-gray-300 mt-6 mb-10 leading-relaxed">
                Our platform stands out with cutting-edge technology and industry-specific assessment methodologies that provide unmatched accuracy and insights.
              </p>
              
              <div className="space-y-8">
                {[
                  {
                    title: "Industry-Specific Assessments",
                    description: "Tailored evaluations designed specifically for your industry's unique requirements and standards.",
                    icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  },
                  {
                    title: "Advanced Analytics",
                    description: "Comprehensive data analysis with actionable insights to drive performance improvement.",
                    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  },
                  {
                    title: "Secure & Reliable",
                    description: "Enterprise-grade security and reliability for confidential assessment data and results.",
                    icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  }
                ].map((feature, index) => (
                  <div key={index} className="flex items-start group transition-all duration-300 transform hover:-translate-x-1">
                    <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 text-white shadow-lg shadow-indigo-500/30 dark:shadow-indigo-700/30 group-hover:from-indigo-400 group-hover:to-blue-400 transition-all duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                      </svg>
                    </div>
                    <div className="ml-6">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">{feature.title}</h3>
                      <p className="mt-2 text-gray-600 dark:text-gray-300">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-12">
                <Link href="/exam-login" className="inline-flex items-center text-indigo-600 dark:text-indigo-400 font-semibold group">
                  <span>Learn more about our platform</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </div>
            
            <div className="relative order-1 lg:order-2 p-8">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-blue-500/5 dark:from-indigo-500/10 dark:to-blue-500/10 transform -rotate-3 rounded-3xl"></div>
              <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-indigo-100 dark:border-indigo-900/50">
                {/* Dashboard header */}
                <div className="bg-gradient-to-r from-indigo-600 to-blue-500 h-2.5"></div>
                <div className="p-6">
                  {/* Top bar with menu */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Acadezone Dashboard</div>
                  </div>
                  
                  {/* Dashboard content */}
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div className="bg-indigo-100 dark:bg-indigo-900/50 rounded-lg px-4 py-2 text-indigo-700 dark:text-indigo-300 font-semibold">Performance Analytics</div>
                      <div className="text-gray-500 dark:text-gray-400 text-sm">Last 30 days</div>
                    </div>
                    
                    {/* Chart */}
                    <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-full w-full"></div>
                    <div className="relative h-64 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <div className="absolute bottom-4 left-0 right-0 flex justify-between items-end px-4">
                        {[30, 65, 45, 75, 55, 85, 70, 60, 80, 40, 90, 50].map((height, i) => (
                          <div key={i} className="w-4 bg-gradient-to-t from-indigo-500 to-blue-500 rounded-t-sm" style={{height: `${height}%`}}></div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-100 dark:border-gray-700">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Score</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">85%</div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-100 dark:border-gray-700">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Percentile</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">92nd</div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-100 dark:border-gray-700">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Time</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">45m</div>
                      </div>
                    </div>
                    
                    <div className="h-12 bg-gray-100 dark:bg-gray-700 rounded-lg"></div>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -z-10 top-10 right-0 w-32 h-32 bg-indigo-300 dark:bg-indigo-600 rounded-full blur-3xl opacity-30"></div>
              <div className="absolute -z-10 -bottom-10 -left-10 w-40 h-40 bg-blue-300 dark:bg-blue-600 rounded-full blur-3xl opacity-30"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section (New) */}
      <section className="py-24 bg-white dark:bg-gray-800 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
          <div className="text-center mb-16">
            <div className="inline-block">
              <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-2">Testimonials</p>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white relative inline-block">
                What Our Users Say
                <div className="absolute -bottom-2 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transform origin-left"></div>
              </h2>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                content: "Acadezone has transformed how we evaluate talent. The detailed analytics and industry-specific assessments are exactly what we needed.",
                author: "Sarah Johnson",
                role: "HR Director, TechCorp",
                avatar: "https://randomuser.me/api/portraits/women/32.jpg"
              },
              {
                content: "The platform's accuracy is outstanding. We've seen a 40% improvement in our hiring success rate since implementing Acadezone.",
                author: "Michael Chen",
                role: "Talent Acquisition, Global Finance Inc",
                avatar: "https://randomuser.me/api/portraits/men/54.jpg"
              },
              {
                content: "As a professional looking to validate my skills, Acadezone provided the most comprehensive assessment I've found. Highly recommended!",
                author: "Emma Rodriguez",
                role: "Software Engineer",
                avatar: "https://randomuser.me/api/portraits/women/68.jpg"
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-gradient-to-br from-indigo-50 to-white dark:from-gray-800 dark:to-indigo-900/30 rounded-2xl shadow-xl p-8 transition-all duration-500 hover:shadow-2xl group relative">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-16 h-16 text-5xl text-indigo-200 dark:text-indigo-800 font-serif">
                  "
                </div>
                <p className="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed relative z-10">
                  {testimonial.content}
                </p>
                <div className="mt-8 flex items-center">
                  <img src={testimonial.avatar} alt={testimonial.author} className="w-12 h-12 rounded-full object-cover border-2 border-indigo-100 dark:border-indigo-900" />
                  <div className="ml-4">
                    <h4 className="text-gray-900 dark:text-white font-medium">{testimonial.author}</h4>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section with enhanced styling */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-blue-700 dark:from-indigo-800 dark:to-blue-900"></div>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-10 bg-gradient-to-r from-indigo-300/10 to-blue-300/10"></div>
        <div className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-64 h-64 text-indigo-500/10">
            <path fill="currentColor" d="M44.7,-76.2C58.9,-69.7,72,-58.8,79.4,-44.7C86.9,-30.6,88.7,-15.3,88.1,-0.3C87.5,14.7,84.6,29.3,77.4,42.3C70.3,55.2,58.9,66.5,45.3,73.2C31.7,80,15.8,82.2,0.5,81.3C-14.8,80.4,-29.6,76.4,-43.7,69.6C-57.8,62.8,-71.2,53.3,-78.8,40.3C-86.3,27.3,-88.1,11.6,-86.3,-2.9C-84.5,-17.5,-79.3,-35,-70.1,-49.3C-60.9,-63.5,-47.7,-74.6,-33.6,-80.9C-19.5,-87.3,-4.7,-89,10.6,-87.1C26,-85.1,52,-86.6,67,-78.7C82,-70.8,87,-35.4,90.2,-0.2C93.3,35.1,94.7,70.1,82.6,93.7C70.5,117.3,45,129.4,23.4,122.2C1.7,115.1,-15.9,88.7,-35.3,75.5C-54.8,62.2,-76.1,62.1,-92.8,52.7C-109.6,43.3,-121.8,24.5,-128.9,2.2C-136,-20.1,-138,-45.9,-127.2,-63.1C-116.4,-80.3,-92.8,-88.9,-70.4,-90.9C-48,-92.8,-26.9,-88.2,-8.1,-81.8C10.7,-75.4,21.4,-67.3,36.1,-72.6C50.9,-77.9,69.9,-96.7,77.4,-94.6C85,-92.5,81,-69.6,78.1,-49.1C75.2,-28.5,73.5,-10.1,71.8,9.7C70.2,29.5,68.6,50.8,59.1,69.6C49.6,88.4,32.1,104.8,10.7,115.6C-10.8,126.3,-36.2,131.5,-57.4,126.1C-78.5,120.7,-95.4,104.9,-105.2,86.2C-115,67.4,-117.7,45.9,-122.2,24.2C-126.7,2.5,-133,-19.4,-128.6,-39.2C-124.3,-58.9,-109.4,-76.5,-91.2,-86.3C-73,-96.1,-51.4,-98.1,-32,-106.3C-12.5,-114.5,4.8,-128.9,21.7,-133.8C38.5,-138.7,55,-134.1,58.8,-119.6C62.7,-105.2,53.8,-80.8,52.3,-62.1C50.8,-43.3,56.5,-30.1,56.5,-17.7C56.4,-5.3,50.5,6.4,49.7,25.1C48.9,43.7,53.2,69.4,45.4,86.2C37.6,103,17.8,111,2.1,108.3C-13.6,105.5,-25.2,92.1,-41.4,84.9C-57.6,77.8,-78.5,77,-97,68.7C-115.5,60.4,-131.7,44.5,-137.3,25.7C-142.9,6.9,-137.9,-14.8,-126.7,-30.3C-115.4,-45.9,-98,-55.3,-81.7,-62.5C-65.4,-69.7,-50.4,-74.7,-35.4,-81.4C-20.4,-88.1,-5.5,-96.4,7.2,-95C19.9,-93.7,30.4,-82.7,44.7,-76.2Z" transform="translate(100 100)" />
          </svg>
        </div>
        
        <div className="max-w-5xl mx-auto px-4 sm:px-8 lg:px-12 text-center relative">
          <div className="inline-flex items-center justify-center px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Ready to get started?
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight">
            Evaluate your professional<br />skills with precision
          </h2>
          <p className="text-xl text-indigo-100 mb-12 max-w-3xl mx-auto">
            Start your assessment journey today and discover your professional strengths and areas for growth with our comprehensive platform.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/exam-login" className="w-full sm:w-auto px-8 py-4 border-0 text-base font-medium rounded-xl bg-white text-indigo-600 hover:bg-indigo-50 shadow-xl shadow-indigo-900/30 transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600">
              Start Assessment
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 inline-block" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
            <Link href="#contact" className="w-full sm:w-auto px-8 py-4 border border-white/30 text-base font-medium rounded-xl text-white hover:bg-white/10 backdrop-blur-sm transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600">
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Footer with improved styling */}
      <footer className="bg-white dark:bg-gray-900 pt-20 pb-12" id="contact">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-10 pb-12 border-b border-gray-200 dark:border-gray-800">
            <div className="md:col-span-3">
              <div className="flex items-center mb-6">
                <Image
                  src="https://acadezone.s3.eu-central-1.amazonaws.com/email-assets/logo.png" 
                  alt="Acadezone Logo" 
                  width={140} 
                  height={40}
                  className="h-8 w-auto"
                />
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md leading-relaxed">
                Acadezone provides industry-leading professional qualification and competency assessment solutions for organizations and individuals worldwide.
              </p>
              <div className="flex space-x-5">
                {[
                  { name: 'Twitter', icon: 'M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84' },
                  { name: 'LinkedIn', icon: 'M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z' },
                  { name: 'Facebook', icon: 'M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z' }
                ].map((social) => (
                  <a key={social.name} href="#" className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    <span className="sr-only">{social.name}</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d={social.icon} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-gray-900 dark:text-white font-semibold mb-6">Solutions</h3>
              <ul className="space-y-4">
                {['Skills Assessment', 'Performance Analytics', 'Competency Mapping', 'Certification'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-gray-900 dark:text-white font-semibold mb-6">Company</h3>
              <ul className="space-y-4">
                {['About', 'Careers', 'Blog', 'Privacy Policy'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-gray-900 dark:text-white font-semibold mb-6">Contact</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href="mailto:hello@acadezone.com" className="text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors">
                    hello@acadezone.com
                  </a>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <a href="tel:+13024007568" className="text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors">
                    US: +1 302 400 75 68
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 flex flex-col md:flex-row items-center justify-between">
            <p className="text-gray-500 dark:text-gray-500 text-sm">
              © {new Date().getFullYear()} Acadezone. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0 flex space-x-6">
              {['Terms', 'Privacy', 'Cookies'].map((item) => (
                <a key={item} href="#" className="text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm transition-colors">
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Add these styles to your global CSS or component */}
      <style jsx global>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -20px) scale(1.1); }
          50% { transform: translate(0, 20px) scale(0.9); }
          75% { transform: translate(-20px, -15px) scale(1.05); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .animate-blob {
          animation: blob 10s infinite ease-in-out;
        }
        
        .animate-float {
          animation: float 6s infinite ease-in-out;
        }
        
        .animate-fadeIn {
          animation: fadeIn 1s ease-out forwards;
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 1s ease-out forwards;
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 8s ease infinite;
        }
        
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 10px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #c7d2fe;
          border-radius: 5px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #818cf8;
        }
        
        /* Dark mode scrollbar */
        .dark::-webkit-scrollbar-track {
          background: #1e293b;
        }
        
        .dark::-webkit-scrollbar-thumb {
          background: #4338ca;
        }
        
        .dark::-webkit-scrollbar-thumb:hover {
          background: #6366f1;
        }
      `}</style>
    </div>
  );
}