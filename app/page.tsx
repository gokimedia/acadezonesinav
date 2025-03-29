import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-indigo-950 dark:to-blue-900">
      {/* Header */}
      <header className="w-full py-6 px-4 sm:px-8 lg:px-12 flex justify-between items-center backdrop-blur-sm bg-white/30 dark:bg-black/20 sticky top-0 z-50 border-b border-indigo-100 dark:border-indigo-950">
        <div className="flex items-center">
        <Image
            src="https://acadezone.s3.eu-central-1.amazonaws.com/email-assets/logo.png" 
            alt="Acadezone Logo" 
          width={180}
            height={50}
          priority
            className="h-10 w-auto"
          />
        </div>
        <nav className="hidden md:flex space-x-10">
          <Link href="#services" className="text-gray-700 hover:text-indigo-600 dark:text-gray-200 dark:hover:text-indigo-400 transition-colors duration-300 font-medium">
            Services
          </Link>
          <Link href="#features" className="text-gray-700 hover:text-indigo-600 dark:text-gray-200 dark:hover:text-indigo-400 transition-colors duration-300 font-medium">
            Features
          </Link>
          <Link href="#contact" className="text-gray-700 hover:text-indigo-600 dark:text-gray-200 dark:hover:text-indigo-400 transition-colors duration-300 font-medium">
            Contact
          </Link>
        </nav>
        <button className="md:hidden text-gray-700 dark:text-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 sm:px-8 lg:px-12 text-center py-16 sm:py-24">
        <div className="relative w-full max-w-6xl mx-auto">
          <div className="absolute -top-40 -left-20 w-72 h-72 bg-blue-500/10 dark:bg-blue-500/20 rounded-full filter blur-3xl animate-blob"></div>
          <div className="absolute -bottom-40 -right-20 w-72 h-72 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500/10 dark:bg-purple-500/20 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>
          <div className="relative">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">
              <span className="block mb-3 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-400 dark:to-blue-300">Acadezone</span>
              <span className="block text-2xl sm:text-3xl md:text-4xl text-gray-800 dark:text-gray-100 leading-tight font-semibold">Professional Qualification and Competency Assessment and Measurement System</span>
            </h1>
            
            <p className="mt-6 max-w-3xl text-xl text-gray-600 dark:text-gray-300 mx-auto">
              An advanced evaluation platform designed to accurately measure industry-specific qualifications, competencies and professional skills.
            </p>
            
            <div className="mt-12 flex justify-center">
              <Link href="/exam-login" className="px-10 py-4 border-0 text-base font-medium rounded-xl text-white bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400 shadow-lg shadow-indigo-500/30 dark:shadow-indigo-700/30 md:text-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                Take an Exam
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
          <div className="bg-white/60 dark:bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-indigo-50 dark:border-indigo-900 transform transition-all duration-300 hover:scale-105">
            <div className="text-indigo-600 dark:text-indigo-400 font-bold text-3xl md:text-4xl">300+</div>
            <div className="text-gray-600 dark:text-gray-300 mt-2">Assessments</div>
          </div>
          <div className="bg-white/60 dark:bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-indigo-50 dark:border-indigo-900 transform transition-all duration-300 hover:scale-105">
            <div className="text-indigo-600 dark:text-indigo-400 font-bold text-3xl md:text-4xl">50+</div>
            <div className="text-gray-600 dark:text-gray-300 mt-2">Industries</div>
          </div>
          <div className="bg-white/60 dark:bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-indigo-50 dark:border-indigo-900 transform transition-all duration-300 hover:scale-105">
            <div className="text-indigo-600 dark:text-indigo-400 font-bold text-3xl md:text-4xl">10K+</div>
            <div className="text-gray-600 dark:text-gray-300 mt-2">Users</div>
          </div>
          <div className="bg-white/60 dark:bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-indigo-50 dark:border-indigo-900 transform transition-all duration-300 hover:scale-105">
            <div className="text-indigo-600 dark:text-indigo-400 font-bold text-3xl md:text-4xl">98%</div>
            <div className="text-gray-600 dark:text-gray-300 mt-2">Accuracy</div>
          </div>
        </div>
      </main>

      {/* Services Section */}
      <section className="py-16 bg-white dark:bg-gray-800" id="services">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl relative inline-block">
              <span className="relative z-10">Our Services</span>
              <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full"></span>
            </h2>
            <p className="mt-6 max-w-3xl text-xl text-gray-500 dark:text-gray-300 mx-auto">
              Comprehensive assessment solutions tailored for various industry sectors
            </p>
          </div>

          <div className="mt-12 grid gap-10 grid-cols-1 md:grid-cols-3">
            {/* Service 1 */}
            <div className="bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-800 dark:to-indigo-900 rounded-2xl shadow-xl p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 group">
              <div className="text-indigo-600 dark:text-indigo-400 mb-6 w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800 transition-colors duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Skills Assessment</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300 leading-relaxed">Comprehensive evaluation of technical and soft skills using advanced psychometric methodologies and industry-specific benchmarks.</p>
            </div>

            {/* Service 2 */}
            <div className="bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-800 dark:to-indigo-900 rounded-2xl shadow-xl p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 group">
              <div className="text-indigo-600 dark:text-indigo-400 mb-6 w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800 transition-colors duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Real-time Analytics</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300 leading-relaxed">Access immediate test results with detailed analytics, insights, and personalized recommendations for improvement.</p>
            </div>

            {/* Service 3 */}
            <div className="bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-800 dark:to-indigo-900 rounded-2xl shadow-xl p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 group">
              <div className="text-indigo-600 dark:text-indigo-400 mb-6 w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800 transition-colors duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Performance Tracking</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300 leading-relaxed">Monitor performance trends, identify improvement areas, and track progress over time with our advanced tracking system.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-indigo-950" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8">
                Why Choose Acadezone?
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-md bg-indigo-600 dark:bg-indigo-500 text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Industry-Specific Assessments</h3>
                    <p className="mt-1 text-gray-600 dark:text-gray-300">Tailored evaluations designed specifically for your industry's unique requirements and standards.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-md bg-indigo-600 dark:bg-indigo-500 text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Advanced Analytics</h3>
                    <p className="mt-1 text-gray-600 dark:text-gray-300">Comprehensive data analysis with actionable insights to drive performance improvement.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-md bg-indigo-600 dark:bg-indigo-500 text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Secure & Reliable</h3>
                    <p className="mt-1 text-gray-600 dark:text-gray-300">Enterprise-grade security and reliability for confidential assessment data and results.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative p-8">
              <div className="absolute inset-0 bg-indigo-600/5 dark:bg-indigo-500/10 rounded-3xl transform -rotate-6"></div>
              <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-indigo-600 dark:bg-indigo-700 h-3"></div>
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="bg-indigo-100 dark:bg-indigo-900/50 rounded-lg px-4 py-2 text-indigo-700 dark:text-indigo-300 font-semibold">Assessment Dashboard</div>
                    <div className="text-gray-500 dark:text-gray-400">Acadezone</div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-full"></div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                      <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                      <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    </div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-3/4"></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                      <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    </div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-1/2"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 lg:px-12 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8">
            Ready to evaluate your skills?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-3xl mx-auto">
            Start your assessment journey today and discover your professional strengths and areas for growth.
          </p>
          <Link href="/exam-login" className="inline-flex items-center justify-center px-8 py-4 border-0 text-base font-medium rounded-xl text-white bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400 shadow-lg shadow-indigo-500/30 dark:shadow-indigo-700/30 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
            Start Assessment
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-gray-900 py-12" id="contact">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="md:col-span-2">
              <div className="flex items-center mb-6">
          <Image
                  src="https://acadezone.s3.eu-central-1.amazonaws.com/email-assets/logo.png" 
                  alt="Acadezone Logo" 
                  width={140} 
                  height={40}
                  className="h-8 w-auto"
                />
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                Acadezone provides industry-leading professional qualification and competency assessment solutions for organizations and individuals worldwide.
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-sm">
                © {new Date().getFullYear()} Acadezone. All rights reserved.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Contact</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-600 dark:text-gray-400">hello@acadezone.com</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-gray-600 dark:text-gray-400">US: +1 302 400 75 68</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Follow Us</h3>
              <div className="flex space-x-5">
                <a href="#" className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
