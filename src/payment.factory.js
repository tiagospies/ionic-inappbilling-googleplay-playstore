(function() {
    "use strict";
    angular.module("your_module")
        .factory("PaymentFactory", [
            "$q",
            "$rootScope",
            "$filter",
            "$state",
            "UserFactory",
            function(
                $q, 
                $rootScope, 
                $filter, 
                $state, 
                UserFactory) {
                var ANDROID_PLATFORM = "Android";
                var IOS_PLATFORM = "iOS";
                var PRO_KEY_TEST = "your_key.test";
                var PRO_KEY = "your_key.prod";
                var APP_IN_TEST = false;
                var payment = {
                    init: function() {
                        var deferred = $q.defer();
                        if (APP_IN_TEST) {
                            deferred.resolve();
                        } else {
                            if ((window.device && device.platform == ANDROID_PLATFORM) && typeof inappbilling !== "undefined") {
                                inappbilling.init(function(resultInit) {
                                    deferred.resolve(resultInit);
                                }, function(errorInit) {
                                    deferred.reject(errorInit);
                                },
                                    { showLog: true },
                                    [PRO_KEY]);
                            } else {
                                deferred.reject();
                            }

                            if ((window.device && device.platform == IOS_PLATFORM) && window.storekit) {
                                storekit.init({
                                    debug: true,
                                    ready: this.iOSReady,
                                    purchase: this.iOSPurchase,
                                    restore: this.iOSRestore,
                                    error: this.iOSError
                                });
                            }
                        }

                        return deferred.promise;
                    },
                    verifySignaturePRO: function(user) {
                        var deferred = $q.defer();
                        if (configAssistenciaFacil.AppInTest) {
                            deferred.resolve(false);
                        } else {
                            var settings = $rootScope.currentUser;
                            if ((window.device && device.platform == IOS_PLATFORM) && window.storekit) {
                                storekit.restore();
                            }
                            if ((window.device && device.platform == ANDROID_PLATFORM) && typeof inappbilling !== "undefined") {

                                inappbilling.getPurchases(function(result) {
                                    if (result.length > 0) {
                                        if (result[0].productId == PRO_KEY && result[0].purchaseState === 0 && result[0].purchaseToken == user.AndroidKey) {
                                            payment.setSignature(result[0].purchaseToken).then(function(result) {
                                                deferred.resolve(result);
                                            });
                                        } else {
                                            payment.removeSignature().then(function(result) {
                                                deferred.resolve(result);
                                            });
                                        }
                                    } else {
                                        payment.removeSignature().then(function(result) {
                                            deferred.resolve(result);
                                        });
                                    }
                                }, function(errorPurchases) {
                                    deferred.reject(errorPurchases);
                                });
                            } else {
                                deferred.reject();
                            }
                        }
                        return deferred.promise;
                    },
                    buyPROVersion: function() {
                        var deferred = $q.defer();
                        if (configAssistenciaFacil.AppInTest) {
                            deferred.resolve(false);
                        } else {
                            var settings = $rootScope.currentUser;
                            if ((window.device && device.platform == IOS_PLATFORM) && window.storekit) {
                                storekit.purchase(PRO_KEY);
                            }
                            if ((window.device && device.platform == ANDROID_PLATFORM) && typeof inappbilling !== "undefined") {
                                inappbilling.subscribe(function(data) {
                                    Object.keys(data).forEach(function(key) {
                                    });
                                    payment.setSignature(data.purchaseToken).then(function(result) {
                                        deferred.resolve(result);
                                    });
                                }, function(err) {
                                    deferred.reject(err);
                                }, PRO_KEY);
                            } else {
                                deferred.reject();
                            }
                        }
                        return deferred.promise;
                    },

                    iOSReady: function() {
                        storekit.load([PRO_KEY], function(products, invalidIds) {
                        });
                    },

                    iOSPurchase: function(transactionId, productId, receipt) {
                        if(transactionId){
                            payment.setSignature(transactionId);
                        }
                    },

                    iOSRestore: function(transactionId, productId, transactionReceipt) {
                        if (productId === PRO_KEY) {
                            payment.setSignature(transactionId); 
                        } else {
                            payment.removeSignature();
                        }
                    },

                    iOSError: function(errorCode, errorMessage) {
                    },

                    setSignature: function(signatureKey) {
                        var deferred = $q.defer();

                        var settings = $rootScope.usuario;
                        if (!settings.Signature) {
                            settings.Signature = 1;
                            if (window.device && device.platform == ANDROID_PLATFORM) {
                                settings.AndroidKey = signatureKey;
                            } else {
                                settings.IOSKey = signatureKey;
                            }
                            UserFactory.setSignature(settings).then(function() {
                                $rootScope.usuario.Signature = 1;
                                $rootScope.usuario.AndroidKey = settings.AndroidKey;
                                $rootScope.usuario.IOSKey = settings.IOSKey;
                                deferred.resolve(false);
                            }, function(err) {
                                deferred.reject(err);
                            });
                        } else {
                            deferred.resolve(false);
                        }
                        return deferred.promise;
                    },

                    removeSignature: function() {
                        var deferred = $q.defer();

                        var settings = $rootScope.usuario;
                        if (settings.Signature) {
                            settings.Signature = 0;
                            UserFactory.update(settings).then(function() {
                                $rootScope.usuario.Signature = 0;
                                deferred.resolve(true);
                            }, function(err) {
                                deferred.reject(err);
                            });
                        } else {
                            deferred.resolve(false);
                        }
                        return deferred.promise;
                    }

                };

                return payment;
            }
        ]);
})();